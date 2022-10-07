import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';

export enum JobId {
  THUMBNAIL_GENERATION = 'thumbnail-generation',
  METADATA_EXTRACTION = 'metadata-extraction',
  VIDEO_CONVERSION = 'video-conversion',
  MACHINE_LEARNING = 'machine-learning',
}

export class GetJobDto {
  @IsNotEmpty()
  @IsEnum(JobId, {
    message: `params must be one of ${Object.values(JobId).join()}`,
  })
  @ApiProperty({
    type: String,
    enum: JobId,
    enumName: 'JobId',
  })
  jobId!: JobId;
}
