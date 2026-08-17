import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { CreateJobDto } from './dto/create-job.dto';
import { JobProcessor } from './job-processor';
import { JobStore } from './job-store';
import { STATUS, TERMINAL_JOB_STATUSES } from './jobs.constants';
import type { Job, JobStatus, JobSummary } from './jobs.types';

@Injectable()
export class JobsService {
  constructor(
    private readonly store: JobStore,
    private readonly processor: JobProcessor,
  ) {}

  /** Создаёт задачу в pending и сразу запускает обработку в фоне. */
  create(dto: CreateJobDto): { jobId: string } {
    const job: Job = {
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      status: STATUS.PENDING,
      items: dto.urls.map((url) => ({
        url,
        status: STATUS.PENDING,
      })),
    };

    this.store.save(job);
    this.processor.start(job.id);
    return { jobId: job.id };
  }

  /** Возвращает список задач, новые сверху. */
  findAll(): JobSummary[] {
    return this.store.getAllNewestFirst().map((job) => this.toSummary(job));
  }

  /** Возвращает задачу по id или 404. */
  findOne(id: string): Job {
    const job = this.store.get(id);
    if (!job) {
      throw new NotFoundException('Job not found');
    }
    return job;
  }

  /** Отменяет задачу и все ещё pending URL; in_progress доводятся до конца. */
  cancel(id: string): Job {
    const job = this.findOne(id);

    if (this.isTerminal(job.status)) {
      throw new ConflictException(
        `Job cannot be cancelled because it is ${job.status}`,
      );
    }

    job.status = STATUS.CANCELLED;
    for (const item of job.items) {
      if (item.status === STATUS.PENDING) {
        item.status = STATUS.CANCELLED;
      }
    }

    return job;
  }

  /** Проверяет, что статус уже финальный. */
  private isTerminal(status: JobStatus): boolean {
    return TERMINAL_JOB_STATUSES.includes(status);
  }

  /** Собирает краткую сводку задачи со статистикой URL. */
  private toSummary(job: Job): JobSummary {
    let success = 0;
    let error = 0;

    for (const item of job.items) {
      if (item.status === STATUS.SUCCESS) {
        success += 1;
      } else if (item.status === STATUS.ERROR) {
        error += 1;
      }
    }

    return {
      id: job.id,
      createdAt: job.createdAt,
      status: job.status,
      stats: {
        total: job.items.length,
        success,
        error,
      },
    };
  }
}
