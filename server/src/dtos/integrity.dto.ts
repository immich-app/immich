import { createZodDto } from 'nestjs-zod';
import { IntegrityReport, IntegrityReportSchema } from 'src/enum';
import z from 'zod';

const IntegrityReportSummaryResponseSchema = z
  .object({
    [IntegrityReport.ChecksumFail]: z.int().nonnegative(),
    [IntegrityReport.MissingFile]: z.int().nonnegative(),
    [IntegrityReport.UntrackedFile]: z.int().nonnegative(),
  })
  .meta({ id: 'IntegrityReportSummaryResponseDto' });

export class IntegrityReportSummaryResponseDto extends createZodDto(IntegrityReportSummaryResponseSchema) {}

const IntegrityGetReportSchema = z
  .object({
    type: IntegrityReportSchema,
    cursor: z.string().optional().describe('Cursor for pagination'),
    limit: z.int().positive().default(500).optional().describe('Number of items per page'),
  })
  .meta({ id: 'IntegrityGetReportDto' });

export class IntegrityGetReportDto extends createZodDto(IntegrityGetReportSchema) {}

const IntegrityDeleteReportSchema = z.object({ type: IntegrityReport }).meta({ id: 'IntegrityDeleteReportDto' });

export class IntegrityDeleteReportDto extends createZodDto(IntegrityDeleteReportSchema) {}

const IntegrityReportResponseItemSchema = z.object({
  id: z.string().describe('Integrity report item id'),
  type: IntegrityReportSchema,
  path: z.string().describe('Integrity report item path'),
});
const IntegrityReportResponseSchema = z
  .object({
    items: z.array(IntegrityReportResponseItemSchema),
    nextCursor: z.string().optional(),
  })
  .meta({ id: 'IntegrityReportResponseDto' });

export class IntegrityReportResponseDto extends createZodDto(IntegrityReportResponseSchema) {}
