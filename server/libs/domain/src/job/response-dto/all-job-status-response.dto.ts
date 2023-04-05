import { ApiProperty } from '@nestjs/swagger';
import { JobName } from '../job.constants';

export class JobCountsDto {
  @ApiProperty({ type: 'integer' })
  active!: number;
  @ApiProperty({ type: 'integer' })
  completed!: number;
  @ApiProperty({ type: 'integer' })
  failed!: number;
  @ApiProperty({ type: 'integer' })
  delayed!: number;
  @ApiProperty({ type: 'integer' })
  waiting!: number;
  @ApiProperty({ type: 'integer' })
  paused!: number;
}

export class QueueStatusDto {
  isActive!: boolean;
  isPaused!: boolean;
}

export class JobStatusDto {
  @ApiProperty({ type: JobCountsDto })
  jobCounts!: JobCountsDto;

  @ApiProperty({ type: QueueStatusDto })
  queueStatus!: QueueStatusDto;
}

export class AllJobStatusResponseDto implements Record<JobName, JobStatusDto> {
  // upload
  @ApiProperty({ type: JobStatusDto })
  [JobName.ASSET_UPLOADED]!: JobStatusDto;

  // conversion
  @ApiProperty({ type: JobStatusDto })
  [JobName.QUEUE_VIDEO_CONVERSION]!: JobStatusDto;
  @ApiProperty({ type: JobStatusDto })
  [JobName.VIDEO_CONVERSION]!: JobStatusDto;

  // thumbnails
  @ApiProperty({ type: JobStatusDto })
  [JobName.QUEUE_GENERATE_THUMBNAILS]!: JobStatusDto;
  @ApiProperty({ type: JobStatusDto })
  [JobName.GENERATE_JPEG_THUMBNAIL]!: JobStatusDto;
  @ApiProperty({ type: JobStatusDto })
  [JobName.GENERATE_WEBP_THUMBNAIL]!: JobStatusDto;

  // metadata
  @ApiProperty({ type: JobStatusDto })
  [JobName.QUEUE_METADATA_EXTRACTION]!: JobStatusDto;
  @ApiProperty({ type: JobStatusDto })
  [JobName.EXIF_EXTRACTION]!: JobStatusDto;
  @ApiProperty({ type: JobStatusDto })
  [JobName.EXTRACT_VIDEO_METADATA]!: JobStatusDto;

  // user deletion
  @ApiProperty({ type: JobStatusDto })
  [JobName.QUEUE_USER_DELETE]!: JobStatusDto;
  @ApiProperty({ type: JobStatusDto })
  [JobName.USER_DELETE]!: JobStatusDto;

  // storage template
  @ApiProperty({ type: JobStatusDto })
  [JobName.STORAGE_TEMPLATE_MIGRATION]!: JobStatusDto;
  @ApiProperty({ type: JobStatusDto })
  [JobName.STORAGE_TEMPLATE_MIGRATION_SINGLE]!: JobStatusDto;
  @ApiProperty({ type: JobStatusDto })
  [JobName.SYSTEM_CONFIG_CHANGE]!: JobStatusDto;

  // object tagging
  @ApiProperty({ type: JobStatusDto })
  [JobName.QUEUE_OBJECT_TAGGING]!: JobStatusDto;
  @ApiProperty({ type: JobStatusDto })
  [JobName.DETECT_OBJECTS]!: JobStatusDto;
  @ApiProperty({ type: JobStatusDto })
  [JobName.CLASSIFY_IMAGE]!: JobStatusDto;

  // cleanup
  @ApiProperty({ type: JobStatusDto })
  [JobName.DELETE_FILES]!: JobStatusDto;

  // search
  @ApiProperty({ type: JobStatusDto })
  [JobName.SEARCH_INDEX_ASSETS]!: JobStatusDto;
  @ApiProperty({ type: JobStatusDto })
  [JobName.SEARCH_INDEX_ASSET]!: JobStatusDto;
  @ApiProperty({ type: JobStatusDto })
  [JobName.SEARCH_INDEX_ALBUMS]!: JobStatusDto;
  @ApiProperty({ type: JobStatusDto })
  [JobName.SEARCH_INDEX_ALBUM]!: JobStatusDto;
  @ApiProperty({ type: JobStatusDto })
  [JobName.SEARCH_REMOVE_ALBUM]!: JobStatusDto;
  @ApiProperty({ type: JobStatusDto })
  [JobName.SEARCH_REMOVE_ASSET]!: JobStatusDto;

  // clip
  @ApiProperty({ type: JobStatusDto })
  [JobName.QUEUE_ENCODE_CLIP]!: JobStatusDto;
  @ApiProperty({ type: JobStatusDto })
  [JobName.ENCODE_CLIP]!: JobStatusDto;
}
