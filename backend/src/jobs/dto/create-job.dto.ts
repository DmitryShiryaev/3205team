import { ArrayMaxSize, ArrayMinSize, IsArray, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { MAX_JOB_URLS } from '../jobs.constants';

function validateUrl(item: unknown): item is string {
  return typeof item === 'string' && item.trim() !== '';
}

function trimAndDropEmpty(value: unknown): unknown {
  if (!Array.isArray(value)) {
    return value;
  }

  return value.filter(validateUrl).map((item) => item.trim());
}

export class CreateJobDto {
  @Transform(({ value }) => trimAndDropEmpty(value))
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_JOB_URLS)
  urls!: string[];
}
