import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { CreateJobDto } from './dto/create-job.dto';
import { JobsService } from './jobs.service';
import type { Job, JobSummary } from './jobs.types';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateJobDto): { jobId: string } {
    return this.jobsService.create(dto);
  }

  @Get()
  findAll(): JobSummary[] {
    return this.jobsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Job {
    return this.jobsService.findOne(id);
  }

  @Delete(':id')
  cancel(@Param('id') id: string): Job {
    return this.jobsService.cancel(id);
  }
}
