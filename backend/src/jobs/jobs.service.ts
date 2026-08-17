import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateJobDto } from './dto/create-job.dto';

@Injectable()
export class JobsService {
  create(_dto: CreateJobDto): { jobId: string } {
    return { jobId: 'not-implemented' };
  }

  findAll(): unknown[] {
    return [];
  }

  findOne(_id: string): never {
    throw new NotFoundException('Job not found');
  }

  cancel(_id: string): never {
    throw new NotFoundException('Job not found');
  }
}
