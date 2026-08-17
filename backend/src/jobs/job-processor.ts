import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { JobStore } from './job-store';
import { STATUS, URL_ERROR_INVALID } from './jobs.constants';
import type { JobProcessorOptions } from './jobs.constants';
import type { Job, UrlItem } from './jobs.types';
import { isHttpUrl, UrlChecker } from './url-checker';
import type { UrlCheckResult } from './url-checker';

export const JOB_PROCESSOR_OPTIONS = Symbol('JOB_PROCESSOR_OPTIONS');

export type { JobProcessorOptions };

@Injectable()
export class JobProcessor implements OnModuleDestroy {
  private stopped = false;
  private readonly abort = new AbortController();
  private readonly sleepResolvers = new Set<() => void>();

  constructor(
    private readonly store: JobStore,
    private readonly checker: UrlChecker,
    @Inject(JOB_PROCESSOR_OPTIONS)
    private readonly options: JobProcessorOptions,
  ) {}

  onModuleDestroy(): void {
    this.stopped = true;
    this.abort.abort();
    for (const resolve of this.sleepResolvers) {
      resolve();
    }
    this.sleepResolvers.clear();
  }

  /** Запускает обработку job в фоне, не блокируя POST. */
  start(jobId: string): void {
    setImmediate(() => {
      void this.run(jobId);
    });
  }

  /** Ставит job в in_progress и обрабатывает URL пачками. */
  private async run(jobId: string): Promise<void> {
    if (this.stopped) {
      return;
    }

    const job = this.store.get(jobId);
    if (!job || job.status === STATUS.CANCELLED) {
      return;
    }

    job.status = STATUS.IN_PROGRESS;

    try {
      await this.processItems(job);
      this.completeIfNotCancelled(jobId);
    } catch {
      this.failIfNotCancelled(jobId);
    }
  }

  /** Параллелит URL внутри одного job, не больше concurrency. */
  private async processItems(job: Job): Promise<void> {
    const concurrency = Math.max(
      1,
      Math.min(this.options.concurrency, job.items.length),
    );
    let nextIndex = 0;

    const worker = async (): Promise<void> => {
      while (!this.stopped) {
        const index = nextIndex;
        nextIndex += 1;
        const item = job.items[index];
        if (!item) {
          return;
        }
        await this.processItem(job, item);
      }
    };

    await Promise.all(Array.from({ length: concurrency }, () => worker()));
  }

  /** Проверяет один URL: отмена / invalid / HTTP / задержка / результат. */
  private async processItem(job: Job, item: UrlItem): Promise<void> {
    if (this.stopped || item.status !== STATUS.PENDING) {
      return;
    }

    if (job.status === STATUS.CANCELLED) {
      item.status = STATUS.CANCELLED;
      return;
    }

    item.status = STATUS.IN_PROGRESS;
    item.startedAt = new Date().toISOString();
    const startedAtMs = Date.now();

    if (!isHttpUrl(item.url)) {
      await this.sleep(this.randomDelayMs());
      this.finishItem(item, startedAtMs, {
        status: STATUS.ERROR,
        error: URL_ERROR_INVALID,
      });
      return;
    }

    let result: UrlCheckResult;
    try {
      result = await this.checker.check(item.url, {
        timeoutMs: this.options.requestTimeoutMs,
        signal: this.abort.signal,
      });
    } catch {
      return;
    }

    await this.sleep(this.randomDelayMs());
    if (this.stopped) {
      return;
    }

    if (result.ok) {
      this.finishItem(item, startedAtMs, {
        status: STATUS.SUCCESS,
        httpStatus: result.httpStatus,
      });
      return;
    }

    this.finishItem(item, startedAtMs, {
      status: STATUS.ERROR,
      error: result.error,
    });
  }

  private finishItem(
    item: UrlItem,
    startedAtMs: number,
    result:
      | { status: typeof STATUS.SUCCESS; httpStatus: number }
      | { status: typeof STATUS.ERROR; error: string },
  ): void {
    if (this.stopped) {
      return;
    }

    item.status = result.status;
    item.finishedAt = new Date().toISOString();
    item.durationMs = Math.max(0, Date.now() - startedAtMs);

    if (result.status === STATUS.SUCCESS) {
      item.httpStatus = result.httpStatus;
      return;
    }

    item.error = result.error;
  }

  /** Ставит completed, если job не успели отменить. */
  private completeIfNotCancelled(jobId: string): void {
    const job = this.store.get(jobId);
    if (job && job.status !== STATUS.CANCELLED) {
      job.status = STATUS.COMPLETED;
    }
  }

  /** Ставит failed только при падении воркера, не при отмене. */
  private failIfNotCancelled(jobId: string): void {
    if (this.stopped) {
      return;
    }

    const job = this.store.get(jobId);
    if (job && job.status !== STATUS.CANCELLED) {
      job.status = STATUS.FAILED;
    }
  }

  private randomDelayMs(): number {
    return Math.floor(Math.random() * (this.options.delayMaxMs + 1));
  }

  private sleep(ms: number): Promise<void> {
    if (ms <= 0 || this.stopped) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      const finish = (): void => {
        clearTimeout(timer);
        this.sleepResolvers.delete(finish);
        resolve();
      };
      const timer = setTimeout(finish, ms);
      this.sleepResolvers.add(finish);
    });
  }
}
