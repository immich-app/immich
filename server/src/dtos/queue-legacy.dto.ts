import { ApiProperty } from '@nestjs/swagger';
import { QueueResponseDto, QueueStatisticsDto } from 'src/dtos/queue.dto';
import { QueueName } from 'src/enum';

export class QueueStatusLegacyDto {
  isActive!: boolean;
  isPaused!: boolean;
}

export class QueueResponseLegacyDto {
  @ApiProperty({ type: QueueStatusLegacyDto })
  queueStatus!: QueueStatusLegacyDto;

  @ApiProperty({ type: QueueStatisticsDto })
  jobCounts!: QueueStatisticsDto;
}

export class QueuesResponseLegacyDto implements Record<QueueName, QueueResponseLegacyDto> {
  @ApiProperty({ type: QueueResponseLegacyDto })
  [QueueName.ThumbnailGeneration]!: QueueResponseLegacyDto;

  @ApiProperty({ type: QueueResponseLegacyDto })
  [QueueName.MetadataExtraction]!: QueueResponseLegacyDto;

  @ApiProperty({ type: QueueResponseLegacyDto })
  [QueueName.VideoConversion]!: QueueResponseLegacyDto;

  @ApiProperty({ type: QueueResponseLegacyDto })
  [QueueName.SmartSearch]!: QueueResponseLegacyDto;

  @ApiProperty({ type: QueueResponseLegacyDto })
  [QueueName.StorageTemplateMigration]!: QueueResponseLegacyDto;

  @ApiProperty({ type: QueueResponseLegacyDto })
  [QueueName.Migration]!: QueueResponseLegacyDto;

  @ApiProperty({ type: QueueResponseLegacyDto })
  [QueueName.BackgroundTask]!: QueueResponseLegacyDto;

  @ApiProperty({ type: QueueResponseLegacyDto })
  [QueueName.Search]!: QueueResponseLegacyDto;

  @ApiProperty({ type: QueueResponseLegacyDto })
  [QueueName.DuplicateDetection]!: QueueResponseLegacyDto;

  @ApiProperty({ type: QueueResponseLegacyDto })
  [QueueName.FaceDetection]!: QueueResponseLegacyDto;

  @ApiProperty({ type: QueueResponseLegacyDto })
  [QueueName.FacialRecognition]!: QueueResponseLegacyDto;

  @ApiProperty({ type: QueueResponseLegacyDto })
  [QueueName.Sidecar]!: QueueResponseLegacyDto;

  @ApiProperty({ type: QueueResponseLegacyDto })
  [QueueName.Library]!: QueueResponseLegacyDto;

  @ApiProperty({ type: QueueResponseLegacyDto })
  [QueueName.Notification]!: QueueResponseLegacyDto;

  @ApiProperty({ type: QueueResponseLegacyDto })
  [QueueName.BackupDatabase]!: QueueResponseLegacyDto;

  @ApiProperty({ type: QueueResponseLegacyDto })
  [QueueName.Ocr]!: QueueResponseLegacyDto;

  @ApiProperty({ type: QueueResponseLegacyDto })
  [QueueName.Workflow]!: QueueResponseLegacyDto;

  @ApiProperty({ type: QueueResponseLegacyDto })
  [QueueName.Editor]!: QueueResponseLegacyDto;
}

export const mapQueueLegacy = (response: QueueResponseDto): QueueResponseLegacyDto => {
  return {
    queueStatus: {
      isPaused: response.isPaused,
      isActive: response.statistics.active > 0,
    },
    jobCounts: response.statistics,
  };
};

export const mapQueuesLegacy = (responses: QueueResponseDto[]): QueuesResponseLegacyDto => {
  const legacy = new QueuesResponseLegacyDto();

  for (const response of responses) {
    legacy[response.name] = mapQueueLegacy(response);
  }

  return legacy;
};
