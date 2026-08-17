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
