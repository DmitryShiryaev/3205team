import { Module } from '@nestjs/common';
import { JobStore } from './job-store';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';

@Module({
  controllers: [JobsController],
  providers: [JobsService, JobStore],
})
export class JobsModule {}
