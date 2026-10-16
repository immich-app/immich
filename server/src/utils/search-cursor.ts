import { BadRequestException } from '@nestjs/common';
import z from 'zod';
import { SearchOrder } from 'src/dtos/search.dto.js';
import { AssetOrder, SearchOrderField } from 'src/enum.js';
import { searchOrderColumns } from 'src/utils/database.js';

const position = { direction: z.enum(AssetOrder), id: z.uuidv4() };

type OrderValue<
  F extends SearchOrderField,
  T extends z.ZodType,
> = (typeof searchOrderColumns)[F]['nullable'] extends true ? z.ZodNullable<T> : T;

const orderValueSchema = <F extends SearchOrderField, T extends z.ZodType>(field: F, schema: T) =>
  (searchOrderColumns[field].nullable ? schema.nullable() : schema) as OrderValue<F, T>;

const timestamp = z.iso.datetime({ offset: true }).transform((value) => new Date(value));

const MetadataCursorSchema = z.discriminatedUnion('field', [
  z.strictObject({
    field: z.literal(SearchOrderField.FileCreatedAt),
    value: orderValueSchema(SearchOrderField.FileCreatedAt, timestamp),
    ...position,
  }),
  z.strictObject({
    field: z.literal(SearchOrderField.LocalDateTime),
    value: orderValueSchema(SearchOrderField.LocalDateTime, timestamp),
    ...position,
  }),
  z.strictObject({
    field: z.literal(SearchOrderField.FileSizeInBytes),
    value: orderValueSchema(SearchOrderField.FileSizeInBytes, z.int().min(0)),
    ...position,
  }),
  z.strictObject({
    field: z.literal(SearchOrderField.Rating),
    value: orderValueSchema(SearchOrderField.Rating, z.int32()),
    ...position,
  }),
]);

const SmartCursorSchema = z.strictObject({ id: z.uuidv4() });

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

type MetadataCursorRow = {
  id: string;
  fileCreatedAt: Date;
  localDateTime: Date;
  fileSizeInByte: number | null;
  rating: number | null;
};

const orderValue = (field: MetadataCursor['field'], row: MetadataCursorRow) => {
  switch (field) {
    case SearchOrderField.FileCreatedAt: {
      return row.fileCreatedAt.toISOString();
    }
    case SearchOrderField.LocalDateTime: {
      return row.localDateTime.toISOString();
    }
    case SearchOrderField.FileSizeInBytes: {
      return row.fileSizeInByte;
    }
    case SearchOrderField.Rating: {
      return row.rating;
    }
  }
};

/** Validated so that the server never hands out a cursor it would reject */
export const encodeMetadataCursor = ({ field, direction }: SearchOrder, row: MetadataCursorRow): string => {
  const payload = { field, direction, value: orderValue(field, row), id: row.id };
  MetadataCursorSchema.parse(payload);
  return encode(payload);
};

export const decodeMetadataCursor = (order: SearchOrder, cursor?: string): MetadataCursor | undefined => {
  const decoded = decode(MetadataCursorSchema, cursor);
  if (decoded && (decoded.field !== order.field || decoded.direction !== order.direction)) {
    throw new BadRequestException(
      `Cursor is for ordering by ${decoded.field} ${decoded.direction}, not ${order.field} ${order.direction}`,
    );
  }

  return decoded;
};

export const encodeSmartCursor = ({ id }: SmartCursor): string => encode({ id });

export const decodeSmartCursor = (cursor?: string): SmartCursor | undefined => decode(SmartCursorSchema, cursor);
