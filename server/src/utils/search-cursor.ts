import { BadRequestException } from '@nestjs/common';
import z from 'zod';

const SearchCursorPayloadSchema = z.object({
  o: z.int().min(0),
});

export const encodeSearchCursor = (offset: number): string =>
  Buffer.from(JSON.stringify({ o: offset } satisfies z.infer<typeof SearchCursorPayloadSchema>)).toString('base64url');

export const decodeSearchCursor = (cursor?: string): { offset: number } => {
  if (cursor === undefined) {
    return { offset: 0 };
  }

  try {
    const payload = SearchCursorPayloadSchema.parse(JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')));
    return { offset: payload.o };
  } catch {
    throw new BadRequestException('Invalid cursor');
  }
};
