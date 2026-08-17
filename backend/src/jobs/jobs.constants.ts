export const MAX_JOB_URLS = 100;

export const STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  FAILED: 'failed',
  SUCCESS: 'success',
  ERROR: 'error',
} as const;

export const JOB_STATUSES = [
  STATUS.PENDING,
  STATUS.IN_PROGRESS,
  STATUS.COMPLETED,
  STATUS.CANCELLED,
  STATUS.FAILED,
] as const;

export const URL_STATUSES = [
  STATUS.PENDING,
  STATUS.IN_PROGRESS,
  STATUS.SUCCESS,
  STATUS.ERROR,
  STATUS.CANCELLED,
] as const;

export type JobStatus = (typeof JOB_STATUSES)[number];
export type UrlStatus = (typeof URL_STATUSES)[number];

export const TERMINAL_JOB_STATUSES: readonly JobStatus[] = [
  STATUS.COMPLETED,
  STATUS.CANCELLED,
  STATUS.FAILED,
];

export const JOB_URL_CONCURRENCY: number = 5;
export const URL_CHECK_DELAY_MAX_MS: number = 10_000;
export const URL_CHECK_TIMEOUT_MS: number = 15_000;

export const URL_ERROR_INVALID: string = 'Invalid URL';
export const URL_ERROR_TIMEOUT: string = 'Request timed out';
export const URL_ERROR_NETWORK: string = 'Network error';

export type JobProcessorOptions = {
  concurrency: number;
  delayMaxMs: number;
  requestTimeoutMs: number;
};

export const DEFAULT_JOB_PROCESSOR_OPTIONS: JobProcessorOptions = {
  concurrency: JOB_URL_CONCURRENCY,
  delayMaxMs: URL_CHECK_DELAY_MAX_MS,
  requestTimeoutMs: URL_CHECK_TIMEOUT_MS,
};
