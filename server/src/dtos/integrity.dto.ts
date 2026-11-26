import { createZodDto } from '@immich/nestjs-standard-schema/zod';
import z from 'zod';
import { IntegrityReport, IntegrityReportSchema } from 'src/enum.js';

const IntegrityReportResponseItemSchema = z.object({
  id: z.uuidv4().describe('Integrity report item id'),
  type: IntegrityReportSchema,
  path: z.string().describe('Integrity report item path'),
});

const IntegrityReportParamSchema = z.object({ type: IntegrityReportSchema }).meta({ id: 'IntegrityReportDto' });

export class IntegrityReportSummaryResponseDto extends createZodDto({
  [IntegrityReport.ChecksumFail]: z.int().nonnegative(),
  [IntegrityReport.MissingFile]: z.int().nonnegative(),
  [IntegrityReport.UntrackedFile]: z.int().nonnegative(),
}) {}

export class IntegrityGetReportDto extends createZodDto({
  type: IntegrityReportSchema,
  cursor: z.string().optional().describe('Cursor for pagination'),
  limit: z.coerce.number().int().positive().default(500).optional().describe('Number of items per page'),
}) {}

export class IntegrityDeleteReportDto extends createZodDto({ type: IntegrityReport }) {}

export class IntegrityReportResponseDto extends createZodDto({
  items: z.array(IntegrityReportResponseItemSchema),
  nextCursor: z.string().optional(),
}) {}

export class IntegrityReportTypeParamDto extends createZodDto(IntegrityReportParamSchema) {}
