import { createZodDto } from 'nestjs-zod';
import { ImmichHeader } from 'src/enum';
import z from 'zod';

const HlsSessionParamSchema = z.object({
  id: z.uuidv4(),
  sessionId: z.uuidv4(),
});

export class HlsSessionParamDto extends createZodDto(HlsSessionParamSchema) {}

const HlsVariantParamSchema = z.object({
  id: z.uuidv4(),
  sessionId: z.uuidv4(),
  variantIndex: z.coerce.number().int().min(0),
});

export class HlsVariantParamDto extends createZodDto(HlsVariantParamSchema) {}

const HlsSegmentParamSchema = z.object({
  id: z.uuidv4(),
  sessionId: z.uuidv4(),
  variantIndex: z.coerce.number().int().min(0),
  filename: z.string().regex(/^(init\.mp4|seg_\d+\.m4s)$/, { error: 'Invalid HLS segment filename' }),
});

export class HlsSegmentParamDto extends createZodDto(HlsSegmentParamSchema) {}

const HlsSegmentHeaderSchema = z.object({
  // Lets the client hint at which segment will be loaded after init.mp4.
  [ImmichHeader.HlsInitSegment]: z.coerce.number().int().min(0).optional(),
});

export class HlsSegmentHeaderDto extends createZodDto(HlsSegmentHeaderSchema) {}
