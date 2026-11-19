import { createZodDto } from '@immich/nestjs-standard-schema/zod';
import z from 'zod';
import { ImmichHeader } from 'src/enum.js';

export class HlsSessionParamDto extends createZodDto({
  id: z.uuidv4(),
  sessionId: z.uuidv4(),
}) {}

export class HlsVariantParamDto extends createZodDto({
  id: z.uuidv4(),
  sessionId: z.uuidv4(),
  variantIndex: z.coerce.number().int().min(0),
}) {}

export class HlsSegmentParamDto extends createZodDto({
  id: z.uuidv4(),
  sessionId: z.uuidv4(),
  variantIndex: z.coerce.number().int().min(0),
  filename: z.string().regex(/^(init\.mp4|seg_\d+\.m4s)$/, { error: 'Invalid HLS segment filename' }),
}) {}

export class HlsSegmentHeaderDto extends createZodDto({
  // Lets the client hint at which segment will be loaded after init.mp4.
  [ImmichHeader.HlsInitSegment]: z.coerce.number().int().min(0).optional(),
}) {}

export class HlsPlaylistHeaderDto extends createZodDto({
  // Lets the client hint at which segment will be loaded after the playlist.
  // A position rather than a segment index since indices aren't comparable across variants.
  [ImmichHeader.HlsPosition]: z.coerce.number().min(0).optional(),
}) {}
