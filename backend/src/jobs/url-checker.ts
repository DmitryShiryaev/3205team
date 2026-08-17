import { Injectable } from '@nestjs/common';
import {
  URL_CHECK_TIMEOUT_MS,
  URL_ERROR_NETWORK,
  URL_ERROR_TIMEOUT,
} from './jobs.constants';

export type UrlCheckResult =
  { ok: true; httpStatus: number } | { ok: false; error: string };

const HEAD_FALLBACK_STATUSES = new Set([405, 501]);

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
  /** HEAD-запрос; при 405/501 повторяет GET. */
  async check(
    url: string,
    options?: { timeoutMs?: number; signal?: AbortSignal },
  ): Promise<UrlCheckResult> {
    const timeoutMs = options?.timeoutMs ?? URL_CHECK_TIMEOUT_MS;
    const head = await this.request('HEAD', url, timeoutMs, options?.signal);

    if (head.ok && HEAD_FALLBACK_STATUSES.has(head.httpStatus)) {
      return this.request('GET', url, timeoutMs, options?.signal);
    }

    return head;
  }

  private async request(
    method: 'HEAD' | 'GET',
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
        method,
        redirect: 'follow',
        signal,
      });
      await discardBody(response);
      return { ok: true, httpStatus: response.status };
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
