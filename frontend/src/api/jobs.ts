import type { Job, JobSummary } from '../types/job';

const API_BASE = '/api';

export class ApiError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

async function throwIfNotOk(res: Response): Promise<void> {
  if (res.ok) {
    return;
  }

  let message = `Ошибка запроса (${res.status})`;
  try {
    const body: unknown = await res.json();
    if (
      typeof body === 'object' &&
      body !== null &&
      'message' in body &&
      typeof body.message === 'string' &&
      body.message.length > 0
    ) {
      message = body.message;
    }
  } catch {
    // оставляем запасной текст
  }

  throw new ApiError(message, res.status);
}

async function readJson<T>(res: Response): Promise<T> {
  await throwIfNotOk(res);
  return (await res.json()) as T;
}

export async function createJob(urls: string[]): Promise<{ jobId: string }> {
  const res = await fetch(`${API_BASE}/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ urls }),
  });

  return readJson<{ jobId: string }>(res);
}

export async function fetchJobs(signal?: AbortSignal): Promise<JobSummary[]> {
  const res = await fetch(`${API_BASE}/jobs`, { signal });
  return readJson<JobSummary[]>(res);
}

export async function fetchJob(
  id: string,
  signal?: AbortSignal,
): Promise<Job> {
  const res = await fetch(`${API_BASE}/jobs/${id}`, { signal });
  return readJson<Job>(res);
}

export async function cancelJob(id: string): Promise<Job> {
  const res = await fetch(`${API_BASE}/jobs/${id}`, { method: 'DELETE' });
  return readJson<Job>(res);
}

export function toErrorMessage(error: unknown): string {
  if (isAbortError(error)) {
    return '';
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return 'Неизвестная ошибка';
}
