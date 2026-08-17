import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { configureApp } from './../src/configure-app';
import { STATUS } from './../src/jobs/jobs.constants';
import type { Job } from './../src/jobs/jobs.types';

interface CreateJobResponse {
  jobId: string;
}

interface ErrorResponse {
  statusCode: number;
  message: string;
}

function jsonBody<T>(res: { body: unknown }): T {
  return res.body as T;
}

describe('JobsController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

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

  it('POST /api/jobs creates a pending job and returns jobId', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/jobs')
      .send({ urls: ['https://example.com', '  not-a-url  '] })
      .expect(201);

    const created = jsonBody<CreateJobResponse>(res);
    expect(typeof created.jobId).toBe('string');
    expect(created.jobId.length).toBeGreaterThan(0);

    const detail = await request(app.getHttpServer())
      .get(`/api/jobs/${created.jobId}`)
      .expect(200);

    const job = jsonBody<Job>(detail);
    expect(job.status).toBe(STATUS.PENDING);
    expect(job.items).toEqual([
      { url: 'https://example.com', status: STATUS.PENDING },
      { url: 'not-a-url', status: STATUS.PENDING },
    ]);
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
      .send({ urls: ['https://example.com'] })
      .expect(201);

    const jobId = jsonBody<CreateJobResponse>(created).jobId;

    const cancelled = await request(app.getHttpServer())
      .delete(`/api/jobs/${jobId}`)
      .expect(200);

    const cancelledJob = jsonBody<Job>(cancelled);
    expect(cancelledJob.status).toBe(STATUS.CANCELLED);
    expect(cancelledJob.items[0].status).toBe(STATUS.CANCELLED);

    await request(app.getHttpServer()).delete(`/api/jobs/${jobId}`).expect(409);
  });
});
