import { createZodDto } from 'nestjs-zod';
import { CalendarHeatmapType } from 'src/enum';
import { isoDateToDate } from 'src/validation';
import z from 'zod';

const CalendarHeatmapTypeSchema = z
  .enum(CalendarHeatmapType)
  .describe('Type of calendar heatmap')
  .meta({ id: 'CalendarHeatmapType' });

const CalendarHeatmapSchema = z
  .object({
    from: isoDateToDate.optional().describe('Start date in UTC'),
    to: isoDateToDate.optional().describe('End date in UTC'),
    type: CalendarHeatmapTypeSchema.optional().default(CalendarHeatmapType.Upload),
  })
  .refine((dto) => !dto.from || !dto.to || dto.from <= dto.to, { message: 'from must be before to', path: ['from'] })
  .meta({ id: 'CalendarHeatmapDto' });

export class CalendarHeatmapDto extends createZodDto(CalendarHeatmapSchema) {}

const CalendarHeatmapResponseSchema = z
  .object({
    from: z.string().describe('Start date in UTC').meta({ example: '2024-01-01' }),
    to: z.string().describe('End date in UTC').meta({ example: '2024-12-31' }),
    series: z.array(
      z.object({
        date: z.string().describe('Date in UTC').meta({ example: '2024-01-01' }),
        count: z.int().nonnegative().describe('Activity count'),
      }),
    ),
    totalCount: z.int().nonnegative().describe('Total activity count over the period'),
  })
  .meta({ id: 'CalendarHeatmapResponseDto' });

export class CalendarHeatmapResponseDto extends createZodDto(CalendarHeatmapResponseSchema) {}
