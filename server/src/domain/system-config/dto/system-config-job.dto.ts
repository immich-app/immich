import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsObject, IsPositive, ValidateNested } from 'class-validator';
import { QueueName } from '../../job';

export class JobSettingsDto {
  @IsInt()
  @IsPositive()
  @ApiProperty({ type: 'integer' })
  concurrency!: number;
}

export class SystemConfigJobDto implements Record<QueueName, JobSettingsDto> {
  @ApiProperty({ type: JobSettingsDto })
  @ValidateNested()
  @IsObject()
  @Type(() => JobSettingsDto)
  [QueueName.THUMBNAIL_GENERATION]!: JobSettingsDto;

  @ApiProperty({ type: JobSettingsDto })
  @ValidateNested()
  @IsObject()
  @Type(() => JobSettingsDto)
  [QueueName.METADATA_EXTRACTION]!: JobSettingsDto;

  @ApiProperty({ type: JobSettingsDto })
  @ValidateNested()
  @IsObject()
  @Type(() => JobSettingsDto)
  [QueueName.VIDEO_CONVERSION]!: JobSettingsDto;

  @ApiProperty({ type: JobSettingsDto })
  @ValidateNested()
  @IsObject()
  @Type(() => JobSettingsDto)
  [QueueName.OBJECT_TAGGING]!: JobSettingsDto;

  @ApiProperty({ type: JobSettingsDto })
  @ValidateNested()
  @IsObject()
  @Type(() => JobSettingsDto)
  [QueueName.CLIP_ENCODING]!: JobSettingsDto;

  @ApiProperty({ type: JobSettingsDto })
  @ValidateNested()
  @IsObject()
  @Type(() => JobSettingsDto)
  [QueueName.STORAGE_TEMPLATE_MIGRATION]!: JobSettingsDto;

  @ApiProperty({ type: JobSettingsDto })
  @ValidateNested()
  @IsObject()
  @Type(() => JobSettingsDto)
  [QueueName.BACKGROUND_TASK]!: JobSettingsDto;

  @ApiProperty({ type: JobSettingsDto })
  @ValidateNested()
  @IsObject()
  @Type(() => JobSettingsDto)
  [QueueName.SEARCH]!: JobSettingsDto;

  @ApiProperty({ type: JobSettingsDto })
  @ValidateNested()
  @IsObject()
  @Type(() => JobSettingsDto)
  [QueueName.RECOGNIZE_FACES]!: JobSettingsDto;

  @ApiProperty({ type: JobSettingsDto })
  @ValidateNested()
  @IsObject()
  @Type(() => JobSettingsDto)
  [QueueName.SIDECAR]!: JobSettingsDto;
}
