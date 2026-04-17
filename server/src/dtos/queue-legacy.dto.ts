import { createZodDto } from 'nestjs-zod';
import { QueueResponseDto, QueueStatisticsSchema } from 'src/dtos/queue.dto';
import { QueueName } from 'src/enum';
import z from 'zod';

const QueueStatusLegacySchema = z
  .object({
    isActive: z.boolean().describe('Whether the queue is currently active (has running jobs)'),
    isPaused: z.boolean().describe('Whether the queue is paused'),
  })
  .meta({ id: 'QueueStatusLegacyDto' });

const QueueResponseLegacySchema = z
  .object({
    queueStatus: QueueStatusLegacySchema,
    jobCounts: QueueStatisticsSchema,
  })
  .meta({ id: 'QueueResponseLegacyDto' });

const QueuesResponseLegacySchema = z
  .object({
    [QueueName.ThumbnailGeneration]: QueueResponseLegacySchema,
    [QueueName.MetadataExtraction]: QueueResponseLegacySchema,
    [QueueName.VideoConversion]: QueueResponseLegacySchema,
    [QueueName.SmartSearch]: QueueResponseLegacySchema,
    [QueueName.StorageTemplateMigration]: QueueResponseLegacySchema,
    [QueueName.Migration]: QueueResponseLegacySchema,
    [QueueName.BackgroundTask]: QueueResponseLegacySchema,
    [QueueName.Search]: QueueResponseLegacySchema,
    [QueueName.DuplicateDetection]: QueueResponseLegacySchema,
    [QueueName.FaceDetection]: QueueResponseLegacySchema,
    [QueueName.FacialRecognition]: QueueResponseLegacySchema,
    [QueueName.Sidecar]: QueueResponseLegacySchema,
    [QueueName.Library]: QueueResponseLegacySchema,
    [QueueName.Notification]: QueueResponseLegacySchema,
    [QueueName.BackupDatabase]: QueueResponseLegacySchema,
    [QueueName.Ocr]: QueueResponseLegacySchema,
    [QueueName.Workflow]: QueueResponseLegacySchema,
    [QueueName.Editor]: QueueResponseLegacySchema,
  })
  .meta({ id: 'QueuesResponseLegacyDto' });

export class QueueResponseLegacyDto extends createZodDto(QueueResponseLegacySchema) {}
export class QueuesResponseLegacyDto extends createZodDto(QueuesResponseLegacySchema) {}

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
