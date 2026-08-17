import type { JobStatus, UrlStatus } from './jobs.constants';

export type { JobStatus, UrlStatus };

export interface UrlItem {
  url: string;
  status: UrlStatus;
  httpStatus?: number;
  error?: string;
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
}

export interface Job {
  id: string;
  createdAt: string;
  status: JobStatus;
  items: UrlItem[];
}

export interface JobStats {
  total: number;
  success: number;
  error: number;
}

export interface JobSummary {
  id: string;
  createdAt: string;
  status: JobStatus;
  stats: JobStats;
}
