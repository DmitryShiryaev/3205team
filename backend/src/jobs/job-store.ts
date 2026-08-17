import { Injectable } from '@nestjs/common';
import type { Job } from './jobs.types';

@Injectable()
export class JobStore {
  private readonly jobs = new Map<string, Job>();

  save(job: Job): void {
    this.jobs.set(job.id, job);
  }

  get(id: string): Job | undefined {
    return this.jobs.get(id);
  }

  /** Newest jobs first (insertion order, reversed). */
  getAllNewestFirst(): Job[] {
    return [...this.jobs.values()].reverse();
  }
}
