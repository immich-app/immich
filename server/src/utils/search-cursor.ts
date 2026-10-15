import { BadRequestException } from '@nestjs/common';
import z from 'zod';
import { SearchOrder } from 'src/dtos/search.dto.js';
import { AssetOrder, SearchOrderField } from 'src/enum.js';

const position = { direction: z.enum(AssetOrder), id: z.uuidv4() };

const MetadataCursorSchema = z.discriminatedUnion('field', [
  z.strictObject({
    field: z.literal([SearchOrderField.FileCreatedAt, SearchOrderField.LocalDateTime]),
    value: z.iso.datetime({ offset: true }),
    ...position,
  }),
  z.strictObject({ field: z.literal(SearchOrderField.FileSizeInBytes), value: z.int().min(0).nullable(), ...position }),
  z.strictObject({ field: z.literal(SearchOrderField.Rating), value: z.int32().nullable(), ...position }),
]);

const SmartCursorSchema = z.strictObject({ distance: z.number(), id: z.uuidv4() });

export type MetadataCursor = z.infer<typeof MetadataCursorSchema>;
export type SmartCursor = z.infer<typeof SmartCursorSchema>;

const encode = (payload: object) => Buffer.from(JSON.stringify(payload)).toString('base64url');

const decode = <T extends z.ZodType>(schema: T, cursor?: string): z.infer<T> | undefined => {
  if (cursor === undefined) {
    return;
  }

  try {
    return schema.parse(JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')));
  } catch {
    throw new BadRequestException('Invalid cursor');
  }
};

/** The position of a page's last row, validated so that the server never hands out a cursor it would reject */
export const encodeMetadataCursor = (
  { field, direction }: SearchOrder,
  { orderValue, id }: { orderValue: unknown; id: string },
): string => encode(MetadataCursorSchema.parse({ field, direction, value: orderValue, id }));

/** A metadata cursor is a position in one ordering, so it must belong to the requested order */
export const decodeMetadataCursor = (order: SearchOrder, cursor?: string): MetadataCursor | undefined => {
  const decoded = decode(MetadataCursorSchema, cursor);
  if (decoded && (decoded.field !== order.field || decoded.direction !== order.direction)) {
    throw new BadRequestException(
      `Cursor is for ordering by ${decoded.field} ${decoded.direction}, not ${order.field} ${order.direction}`,
    );
  }

  return decoded;
};

export const encodeSmartCursor = ({ distance, id }: SmartCursor): string => encode({ distance, id });

export const decodeSmartCursor = (cursor?: string): SmartCursor | undefined => decode(SmartCursorSchema, cursor);
