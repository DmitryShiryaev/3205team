import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { configureApp } from './../src/configure-app';
import {
  JOB_PROCESSOR_OPTIONS,
  type JobProcessorOptions,
} from './../src/jobs/job-processor';
import {
  JOB_URL_CONCURRENCY,
  STATUS,
  URL_CHECK_TIMEOUT_MS,
  URL_ERROR_INVALID,
} from './../src/jobs/jobs.constants';
import type { Job } from './../src/jobs/jobs.types';
import { UrlChecker } from './../src/jobs/url-checker';
import type { UrlCheckResult } from './../src/jobs/url-checker';

interface CreateJobResponse {
  jobId: string;
}

interface ErrorResponse {
  statusCode: number;
  message: string;
}

const testProcessorOptions: JobProcessorOptions = {
  concurrency: JOB_URL_CONCURRENCY,
  delayMaxMs: 0,
  requestTimeoutMs: URL_CHECK_TIMEOUT_MS,
};

function jsonBody<T>(res: { body: unknown }): T {
  return res.body as T;
}

/** HTTP-проверка, которая висит, пока тест не закроет приложение. */
function hangingCheck(
  _url: string,
  options?: { signal?: AbortSignal },
): Promise<UrlCheckResult> {
  return new Promise((_resolve, reject) => {
    const signal = options?.signal;
    if (signal?.aborted) {
      reject(new Error('Aborted'));
      return;
    }
    signal?.addEventListener('abort', () => {
      reject(new Error('Aborted'));
    });
  });
}

async function waitForJob(
  app: INestApplication<App>,
  jobId: string,
  isReady: (job: Job) => boolean,
): Promise<Job> {
  const deadline = Date.now() + 2000;

  while (Date.now() < deadline) {
    const res = await request(app.getHttpServer())
      .get(`/api/jobs/${jobId}`)
      .expect(200);
    const job = jsonBody<Job>(res);
    if (isReady(job)) {
      return job;
    }
    await new Promise((resolve) => setTimeout(resolve, 20));
  }

  throw new Error(`Timed out waiting for job ${jobId}`);
}

describe('JobsController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(JOB_PROCESSOR_OPTIONS)
      .useValue(testProcessorOptions)
      .overrideProvider(UrlChecker)
      .useValue({ check: hangingCheck })
      .compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /api/jobs returns an empty list', () => {
    return request(app.getHttpServer()).get('/api/jobs').expect(200).expect([]);
  });

  it('POST /api/jobs creates a job and returns jobId', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/jobs')
      .send({ urls: ['https://yandex.ru', '  not-a-url  '] })
      .expect(201);

    const created = jsonBody<CreateJobResponse>(res);
    expect(typeof created.jobId).toBe('string');
    expect(created.jobId.length).toBeGreaterThan(0);

    const job = await waitForJob(
      app,
      created.jobId,
      (current) => current.items[1]?.status === STATUS.ERROR,
    );

    expect(job.items.map((item) => item.url)).toEqual([
      'https://yandex.ru',
      'not-a-url',
    ]);
    expect(job.items[1]?.error).toBe(URL_ERROR_INVALID);
    expect(job.items[0]?.status).not.toBe(STATUS.CANCELLED);
  });

  it('POST /api/jobs completes when every URL is invalid', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/jobs')
      .send({ urls: ['not-a-url'] })
      .expect(201);

    const jobId = jsonBody<CreateJobResponse>(res).jobId;
    const job = await waitForJob(
      app,
      jobId,
      (current) => current.status === STATUS.COMPLETED,
    );

    expect(job.items[0]?.status).toBe(STATUS.ERROR);
    expect(job.items[0]?.error).toBe(URL_ERROR_INVALID);
    expect(job.items[0]?.httpStatus).toBeUndefined();
    expect(typeof job.items[0]?.durationMs).toBe('number');
  });

  it('POST /api/jobs returns 400 for an empty list', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/jobs')
      .send({ urls: ['  ', ''] })
      .expect(400);

    const body = jsonBody<ErrorResponse>(res);
    expect(body.statusCode).toBe(400);
    expect(typeof body.message).toBe('string');
    expect(body.message.length).toBeGreaterThan(0);
  });

  it('GET /api/jobs/:id returns 404 for unknown id', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/jobs/missing')
      .expect(404);

    expect(jsonBody<ErrorResponse>(res)).toEqual({
      statusCode: 404,
      message: 'Job not found',
    });
  });

  it('DELETE /api/jobs/:id cancels pending urls', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/jobs')
      .send({ urls: ['https://yandex.ru'] })
      .expect(201);

    const jobId = jsonBody<CreateJobResponse>(created).jobId;

    const cancelled = await request(app.getHttpServer())
      .delete(`/api/jobs/${jobId}`)
      .expect(200);

    const cancelledJob = jsonBody<Job>(cancelled);
    expect(cancelledJob.status).toBe(STATUS.CANCELLED);
    expect(cancelledJob.items[0]?.status).not.toBe(STATUS.PENDING);

    await request(app.getHttpServer()).delete(`/api/jobs/${jobId}`).expect(409);
  });
});
