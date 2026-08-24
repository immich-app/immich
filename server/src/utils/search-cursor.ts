import { BadRequestException } from '@nestjs/common';
import z from 'zod';

const SearchCursorPayloadSchema = z.object({
  offset: z.int().min(0),
});

export const encodeSearchCursor = (offset: number): string =>
  Buffer.from(JSON.stringify({ offset } satisfies z.infer<typeof SearchCursorPayloadSchema>)).toString('base64url');

export const decodeSearchCursor = (cursor?: string): { offset: number } => {
  if (cursor === undefined) {
    return { offset: 0 };
  }

  try {
    return SearchCursorPayloadSchema.parse(JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')));
  } catch {
    throw new BadRequestException('Invalid cursor');
  }
};
