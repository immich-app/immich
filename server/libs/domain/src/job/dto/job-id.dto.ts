import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { JobName } from '../job.constants';

export class JobIdDto {
  @IsNotEmpty()
  @IsEnum(JobName)
  @ApiProperty({ type: String, enum: JobName, enumName: 'JobName' })
  jobId!: JobName;
}
