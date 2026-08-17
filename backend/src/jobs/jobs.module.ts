import { Module } from '@nestjs/common';
import { DEFAULT_JOB_PROCESSOR_OPTIONS } from './jobs.constants';
import { JOB_PROCESSOR_OPTIONS, JobProcessor } from './job-processor';
import { JobStore } from './job-store';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';
import { UrlChecker } from './url-checker';

@Module({
  controllers: [JobsController],
  providers: [
    JobsService,
    JobStore,
    JobProcessor,
    UrlChecker,
    {
      provide: JOB_PROCESSOR_OPTIONS,
      useValue: DEFAULT_JOB_PROCESSOR_OPTIONS,
    },
  ],
})
export class JobsModule {}
