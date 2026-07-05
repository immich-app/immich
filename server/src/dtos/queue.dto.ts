import { createZodDto } from 'nestjs-zod';
import { HistoryBuilder } from 'src/decorators';
import { JobNameSchema, QueueCommandSchema, QueueJobStatusSchema, QueueNameSchema } from 'src/enum';
import z from 'zod';

const QueueNameParamSchema = z
  .object({
    name: QueueNameSchema,
  })
  .meta({ id: 'QueueNameParamDto' });

const QueueCommandSchemaDto = z
  .object({
    command: QueueCommandSchema,
    force: z.boolean().optional().describe('Force the command execution (if applicable)'),
  })
  .meta({ id: 'QueueCommandDto' });

const QueueUpdateSchema = z
  .object({
    isPaused: z.boolean().optional().describe('Whether to pause the queue'),
  })
  .meta({ id: 'QueueUpdateDto' });

const QueueDeleteSchema = z
  .object({
    failed: z
      .boolean()
      .optional()
      .describe('If true, will also remove failed jobs from the queue.')
      .meta(new HistoryBuilder().added('v2.4.0').alpha('v2.4.0').getExtensions()),
  })
  .meta({ id: 'QueueDeleteDto' });

const QueueJobSearchSchema = z
  .object({
    status: z.array(QueueJobStatusSchema).optional().describe('Filter jobs by status'),
  })
  .meta({ id: 'QueueJobSearchDto' });

const QueueJobResponseSchema = z
  .object({
    id: z.string().optional().describe('Job ID'),
    name: JobNameSchema,
    data: z.record(z.string(), z.unknown()).describe('Job data payload'),
    timestamp: z.int().describe('Job creation timestamp'),
  })
  .meta({ id: 'QueueJobResponseDto' });

export const QueueStatisticsSchema = z
  .object({
    active: z.int().describe('Number of active jobs'),
    completed: z.int().describe('Number of completed jobs'),
    failed: z.int().describe('Number of failed jobs'),
    delayed: z.int().describe('Number of delayed jobs'),
    waiting: z.int().describe('Number of waiting jobs'),
    paused: z.int().describe('Number of paused jobs'),
  })
  .meta({ id: 'QueueStatisticsDto' });

const QueueResponseSchema = z
  .object({
    name: QueueNameSchema,
    isPaused: z.boolean().describe('Whether the queue is paused'),
    statistics: QueueStatisticsSchema,
  })
  .meta({ id: 'QueueResponseDto' });

export class QueueNameParamDto extends createZodDto(QueueNameParamSchema) {}
export class QueueCommandDto extends createZodDto(QueueCommandSchemaDto) {}
export class QueueUpdateDto extends createZodDto(QueueUpdateSchema) {}
export class QueueDeleteDto extends createZodDto(QueueDeleteSchema) {}
export class QueueJobSearchDto extends createZodDto(QueueJobSearchSchema) {}
export class QueueJobResponseDto extends createZodDto(QueueJobResponseSchema) {}
export class QueueStatisticsDto extends createZodDto(QueueStatisticsSchema) {}
export class QueueResponseDto extends createZodDto(QueueResponseSchema) {}
