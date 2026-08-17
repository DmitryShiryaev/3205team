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

export function processedCount(job: Job): number {
  return job.items.filter(
    (item) =>
      item.status !== STATUS.PENDING && item.status !== STATUS.IN_PROGRESS,
  ).length;
}

export function parseUrlLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line !== '');
}
