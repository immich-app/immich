import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { SearchOrderField } from 'src/enum.js';
import {
  decodeMetadataCursor,
  decodeSmartCursor,
  encodeMetadataCursor,
  encodeSmartCursor,
} from 'src/utils/search-cursor.js';

const encodePayload = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');

describe('metadata cursor', () => {
  const id = '3f2a1c4e-8b7d-4e6f-9a1b-2c3d4e5f6a7b';

  it('should round-trip a timestamp with microsecond precision', () => {
    const cursor = { field: SearchOrderField.FileCreatedAt, value: '2024-05-01T10:00:00.123456+00:00', id } as const;
    expect(decodeMetadataCursor(encodeMetadataCursor(cursor), SearchOrderField.FileCreatedAt)).toEqual(cursor);
  });

  it('should round-trip a null value of a nullable order field', () => {
    const cursor = { field: SearchOrderField.Rating, value: null, id } as const;
    expect(decodeMetadataCursor(encodeMetadataCursor(cursor), SearchOrderField.Rating)).toEqual(cursor);
  });

  it('should treat a missing cursor as the first page', () => {
    expect(decodeMetadataCursor(undefined, SearchOrderField.FileCreatedAt)).toBeUndefined();
  });

  it('should reject a cursor for a different order field', () => {
    const cursor = encodeMetadataCursor({ field: SearchOrderField.FileCreatedAt, value: '2024-05-01T10:00:00Z', id });
    expect(() => decodeMetadataCursor(cursor, SearchOrderField.FileSizeInBytes)).toThrowError(
      new BadRequestException('Cursor is for ordering by fileCreatedAt, not fileSizeInBytes'),
    );
  });

  it.each([
    ['garbage', '!!!not-base64!!!'],
    ['an offset cursor', encodePayload({ offset: 250 })],
    ['a missing id', encodePayload({ field: SearchOrderField.FileCreatedAt, value: '2024-05-01T10:00:00Z' })],
    ['a number for a timestamp field', encodePayload({ field: SearchOrderField.FileCreatedAt, value: 1, id })],
    ['null for a non-nullable field', encodePayload({ field: SearchOrderField.LocalDateTime, value: null, id })],
    ['an unknown field', encodePayload({ field: 'id', value: id, id })],
  ])('should reject %s', (_, cursor) => {
    expect(() => decodeMetadataCursor(cursor, SearchOrderField.FileCreatedAt)).toThrowError(
      new BadRequestException('Invalid cursor'),
    );
  });
});

describe('smart cursor', () => {
  const id = '3f2a1c4e-8b7d-4e6f-9a1b-2c3d4e5f6a7b';

  it('should round-trip an asset id', () => {
    expect(decodeSmartCursor(encodeSmartCursor({ id }))).toEqual({ id });
  });

  it('should treat a missing cursor as the first page', () => {
    expect(decodeSmartCursor(undefined)).toBeUndefined();
  });

  it('should reject a cursor without an asset id', () => {
    const cursor = encodePayload({ offset: 2 });
    expect(() => decodeSmartCursor(cursor)).toThrowError(new BadRequestException('Invalid cursor'));
  });
});
