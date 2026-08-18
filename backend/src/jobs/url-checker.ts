import { Injectable } from '@nestjs/common';
import {
  URL_CHECK_TIMEOUT_MS,
  URL_CHECK_USER_AGENT,
  URL_ERROR_NETWORK,
  URL_ERROR_TIMEOUT,
} from './jobs.constants';

export type UrlCheckResult =
  | { ok: true; httpStatus: number }
  | { ok: false; error: string; httpStatus?: number };

function classifyHttpStatus(status: number): UrlCheckResult {
  if (status >= 200 && status < 400) {
    return { ok: true, httpStatus: status };
  }

  return {
    ok: false,
    httpStatus: status,
    error: `HTTP ${String(status)}`,
  };
}

export function isHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

@Injectable()
export class UrlChecker {
  /** HTTP HEAD, таймаут по умолчанию 15 с. */
  async check(
    url: string,
    options?: { timeoutMs?: number; signal?: AbortSignal },
  ): Promise<UrlCheckResult> {
    const timeoutMs = options?.timeoutMs ?? URL_CHECK_TIMEOUT_MS;
    return this.request(url, timeoutMs, options?.signal);
  }

  private async request(
    url: string,
    timeoutMs: number,
    external?: AbortSignal,
  ): Promise<UrlCheckResult> {
    if (external?.aborted) {
      throw new Error('Aborted');
    }

    const timeout = AbortSignal.timeout(timeoutMs);
    const signal =
      external && typeof AbortSignal.any === 'function'
        ? AbortSignal.any([timeout, external])
        : timeout;

    try {
      const response = await fetch(url, {
        method: 'HEAD',
        redirect: 'follow',
        signal,
        headers: { 'User-Agent': URL_CHECK_USER_AGENT },
      });
      await discardBody(response);
      return classifyHttpStatus(response.status);
    } catch (error) {
      if (external?.aborted) {
        throw error instanceof Error ? error : new Error('Aborted');
      }

      return {
        ok: false,
        error: isTimeoutError(error) ? URL_ERROR_TIMEOUT : URL_ERROR_NETWORK,
      };
    }
  }
}

async function discardBody(response: Response): Promise<void> {
  if (!response.body) {
    return;
  }

  try {
    await response.body.cancel();
  } catch {
    // Тело нам не нужно, ошибка отмены не влияет на статус.
  }
}

function isTimeoutError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  if (error.name === 'TimeoutError' || error.name === 'AbortError') {
    return true;
  }

  const cause = 'cause' in error ? error.cause : undefined;
  return (
    cause instanceof Error &&
    (cause.name === 'TimeoutError' || cause.name === 'AbortError')
  );
}
