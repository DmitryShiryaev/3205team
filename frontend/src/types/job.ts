export const STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  FAILED: 'failed',
  SUCCESS: 'success',
  ERROR: 'error',
} as const;

export const TERMINAL_JOB_STATUSES = [
  STATUS.COMPLETED,
  STATUS.CANCELLED,
  STATUS.FAILED,
] as const;

export const MAX_JOB_URLS = 100;

export type JobStatus =
  | typeof STATUS.PENDING
  | typeof STATUS.IN_PROGRESS
  | typeof STATUS.COMPLETED
  | typeof STATUS.CANCELLED
  | typeof STATUS.FAILED;

export type UrlStatus =
  | typeof STATUS.PENDING
  | typeof STATUS.IN_PROGRESS
  | typeof STATUS.SUCCESS
  | typeof STATUS.ERROR
  | typeof STATUS.CANCELLED;

export type UrlItem = {
  url: string;
  status: UrlStatus;
  httpStatus?: number;
  error?: string;
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
};

export type JobStats = {
  total: number;
  success: number;
  error: number;
};

export type Job = {
  id: string;
  createdAt: string;
  status: JobStatus;
  items: UrlItem[];
};

export type JobSummary = {
  id: string;
  createdAt: string;
  status: JobStatus;
  stats: JobStats;
};

export function isTerminalJobStatus(status: JobStatus): boolean {
  return (TERMINAL_JOB_STATUSES as readonly JobStatus[]).includes(status);
}

/** Прогресс в деталях: отменённые URL не считаются «обработанными». */
export function jobProgressText(job: Job): string {
  let checked = 0;
  let cancelled = 0;

  for (const item of job.items) {
    if (item.status === STATUS.SUCCESS || item.status === STATUS.ERROR) {
      checked += 1;
    } else if (item.status === STATUS.CANCELLED) {
      cancelled += 1;
    }
  }

  if (job.status === STATUS.CANCELLED || cancelled > 0) {
    return `${String(checked)} проверено, ${String(cancelled)} отменено`;
  }

  return `${String(checked)} из ${String(job.items.length)} обработано`;
}

/** После отмены job уже terminal, но in_progress URL ещё дорабатывают. */
export function shouldPollJob(job: Job | null): boolean {
  if (!job) {
    return false;
  }

  if (!isTerminalJobStatus(job.status)) {
    return true;
  }

  return job.items.some((item) => item.status === STATUS.IN_PROGRESS);
}

export function parseUrlLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line !== '');
}

export function formatDateTime(value: string): string {
  return new Date(value).toLocaleString('ru');
}
