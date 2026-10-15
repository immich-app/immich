import { BadRequestException } from '@nestjs/common';
import z from 'zod';
import { SearchOrderField } from 'src/enum.js';

// timestamps keep the database's microsecond precision, which a JS Date would truncate
const timestampValue = z.iso.datetime({ offset: true });

const MetadataCursorSchema = z.discriminatedUnion('field', [
  z.object({ field: z.literal(SearchOrderField.FileCreatedAt), value: timestampValue, id: z.uuidv4() }),
  z.object({ field: z.literal(SearchOrderField.LocalDateTime), value: timestampValue, id: z.uuidv4() }),
  z.object({ field: z.literal(SearchOrderField.FileSizeInBytes), value: z.int().min(0).nullable(), id: z.uuidv4() }),
  z.object({ field: z.literal(SearchOrderField.Rating), value: z.int().nullable(), id: z.uuidv4() }),
]);

const SmartCursorSchema = z.object({ id: z.uuidv4() });

export type MetadataCursor = z.infer<typeof MetadataCursorSchema>;
export type SmartCursor = z.infer<typeof SmartCursorSchema>;

const encode = (payload: object) => Buffer.from(JSON.stringify(payload)).toString('base64url');

const decode = <T extends z.ZodType>(cursor: string, schema: T): z.infer<T> => {
  try {
    return schema.parse(JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')));
  } catch {
    throw new BadRequestException('Invalid cursor');
  }
};

export const encodeMetadataCursor = (cursor: MetadataCursor): string => encode(cursor);

/** A metadata cursor is a position in one ordering, so it must belong to the requested order field */
export const decodeMetadataCursor = (
  cursor: string | undefined,
  field: SearchOrderField,
): MetadataCursor | undefined => {
  if (cursor === undefined) {
    return;
  }

  const decoded = decode(cursor, MetadataCursorSchema);
  if (decoded.field !== field) {
    throw new BadRequestException(`Cursor is for ordering by ${decoded.field}, not ${field}`);
  }

  return decoded;
};

export const encodeSmartCursor = (cursor: SmartCursor): string => encode(cursor);

export const decodeSmartCursor = (cursor?: string): SmartCursor | undefined =>
  cursor === undefined ? undefined : decode(cursor, SmartCursorSchema);
