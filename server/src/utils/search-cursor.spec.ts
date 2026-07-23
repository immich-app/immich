import { BadRequestException } from '@nestjs/common';
import { decodeSearchCursor, encodeSearchCursor } from 'src/utils/search-cursor';
import { describe, expect, it } from 'vitest';

describe('encodeSearchCursor', () => {
  it('should produce an opaque base64url string', () => {
    const cursor = encodeSearchCursor(250);
    expect(cursor).toMatch(/^[\w-]+$/);
  });

  it('should round-trip an offset', () => {
    for (const offset of [0, 1, 250, 1_000_000]) {
      expect(decodeSearchCursor(encodeSearchCursor(offset))).toEqual({ offset });
    }
  });
});

describe('decodeSearchCursor', () => {
  const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');

  it('should treat a missing cursor as the first page', () => {
    expect(decodeSearchCursor(undefined)).toEqual({ offset: 0 });
  });

  it.each([
    ['empty string', ''],
    ['garbage that is not base64url', '!!!not-base64!!!'],
    ['base64 of non-JSON', Buffer.from('not json').toString('base64url')],
    ['JSON without an offset', encode({})],
    ['JSON with a non-object payload', encode(42)],
    ['null payload', encode(null)],
    ['negative offset', encode({ o: -1 })],
    ['fractional offset', encode({ o: 1.5 })],
    ['string offset', encode({ o: '5' })],
  ])('should reject %s', (_, cursor) => {
    expect(() => decodeSearchCursor(cursor)).toThrowError(new BadRequestException('Invalid cursor'));
  });
});
