import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { AssetOrder, SearchOrderField } from 'src/enum.js';
import {
  decodeMetadataCursor,
  decodeSmartCursor,
  encodeMetadataCursor,
  encodeSmartCursor,
} from 'src/utils/search-cursor.js';

const encodePayload = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');

const id = '3f2a1c4e-8b7d-4e6f-9a1b-2c3d4e5f6a7b';

describe('metadata cursor', () => {
  const order = { field: SearchOrderField.FileCreatedAt, direction: AssetOrder.Desc };

  it('should round-trip a timestamp with microsecond precision', () => {
    const orderValue = '2024-05-01T10:00:00.123456+00:00';
    const cursor = encodeMetadataCursor(order, { orderValue, id });
    expect(decodeMetadataCursor(order, cursor)).toEqual({ ...order, value: orderValue, id });
  });

  it('should round-trip a null value of a nullable order field', () => {
    const rating = { field: SearchOrderField.Rating, direction: AssetOrder.Asc };
    const cursor = encodeMetadataCursor(rating, { orderValue: null, id });
    expect(decodeMetadataCursor(rating, cursor)).toEqual({ ...rating, value: null, id });
  });

  it('should refuse to encode a value that does not fit the order field', () => {
    expect(() => encodeMetadataCursor(order, { orderValue: 3, id })).toThrow();
  });

  it('should treat a missing cursor as the first page', () => {
    expect(decodeMetadataCursor(order)).toBeUndefined();
  });

  it('should reject a cursor for a different order field', () => {
    const cursor = encodeMetadataCursor(order, { orderValue: '2024-05-01T10:00:00+00:00', id });
    expect(() =>
      decodeMetadataCursor({ field: SearchOrderField.FileSizeInBytes, direction: AssetOrder.Desc }, cursor),
    ).toThrowError(new BadRequestException('Cursor is for ordering by fileCreatedAt desc, not fileSizeInBytes desc'));
  });

  it('should reject a cursor for a different order direction', () => {
    const cursor = encodeMetadataCursor(order, { orderValue: '2024-05-01T10:00:00+00:00', id });
    expect(() => decodeMetadataCursor({ ...order, direction: AssetOrder.Asc }, cursor)).toThrowError(
      new BadRequestException('Cursor is for ordering by fileCreatedAt desc, not fileCreatedAt asc'),
    );
  });

  it.each([
    ['garbage', '!!!not-base64!!!'],
    ['an offset cursor', encodePayload({ offset: 250 })],
    ['a missing id', encodePayload({ ...order, value: '2024-05-01T10:00:00Z' })],
    [
      'a missing direction',
      encodePayload({ field: SearchOrderField.FileCreatedAt, value: '2024-05-01T10:00:00Z', id }),
    ],
    ['a number for a timestamp field', encodePayload({ ...order, value: 1, id })],
    [
      'null for a non-nullable field',
      encodePayload({ ...order, field: SearchOrderField.LocalDateTime, value: null, id }),
    ],
    [
      'a rating beyond the integer column',
      encodePayload({ ...order, field: SearchOrderField.Rating, value: 2 ** 40, id }),
    ],
    ['an unknown field', encodePayload({ ...order, field: 'id', value: id, id })],
    ['an unknown key', encodePayload({ ...order, value: '2024-05-01T10:00:00Z', id, offset: 250 })],
    ['a smart cursor', encodeSmartCursor({ distance: 0.5, id })],
  ])('should reject %s', (_, cursor) => {
    expect(() => decodeMetadataCursor(order, cursor)).toThrowError(new BadRequestException('Invalid cursor'));
  });
});

describe('smart cursor', () => {
  it('should round-trip the distance and asset id', () => {
    const cursor = { distance: 0.1 + 0.2, id };
    expect(decodeSmartCursor(encodeSmartCursor(cursor))).toEqual(cursor);
  });

  it('should only encode the position of a row', () => {
    const row = { distance: 0.5, id, originalPath: '/photos/a.jpg' };
    expect(decodeSmartCursor(encodeSmartCursor(row))).toEqual({ distance: 0.5, id });
  });

  it('should treat a missing cursor as the first page', () => {
    expect(decodeSmartCursor()).toBeUndefined();
  });

  it.each([
    ['an offset cursor', encodePayload({ offset: 2 })],
    ['an asset id without a distance', encodePayload({ id })],
    [
      'a metadata cursor',
      encodeMetadataCursor(
        { field: SearchOrderField.FileCreatedAt, direction: AssetOrder.Desc },
        { orderValue: '2024-05-01T10:00:00+00:00', id },
      ),
    ],
  ])('should reject %s', (_, cursor) => {
    expect(() => decodeSmartCursor(cursor)).toThrowError(new BadRequestException('Invalid cursor'));
  });
});
