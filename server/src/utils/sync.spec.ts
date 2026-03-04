import { SyncEntityType } from 'src/enum';
import { fromAck, mapJsonLine, serialize, toAck } from 'src/utils/sync';
import { describe, expect, it } from 'vitest';

describe('fromAck', () => {
  it('should parse an ack string without extraId', () => {
    const result = fromAck('UserV1|abc123');

    expect(result).toEqual({
      type: 'UserV1',
      updateId: 'abc123',
      extraId: undefined,
    });
  });

  it('should parse an ack string with extraId', () => {
    const result = fromAck('AssetV1|update-id|extra-id');

    expect(result).toEqual({
      type: 'AssetV1',
      updateId: 'update-id',
      extraId: 'extra-id',
    });
  });

  it('should handle a SyncEntityType value as the type', () => {
    const result = fromAck(`${SyncEntityType.PartnerV1}|some-update`);

    expect(result).toEqual({
      type: SyncEntityType.PartnerV1,
      updateId: 'some-update',
      extraId: undefined,
    });
  });
});

describe('toAck', () => {
  it('should produce an ack string without extraId', () => {
    const result = toAck({ type: SyncEntityType.UserV1, updateId: 'abc123' });

    expect(result).toBe('UserV1|abc123');
  });

  it('should produce an ack string with extraId', () => {
    const result = toAck({ type: SyncEntityType.AssetV1, updateId: 'update-id', extraId: 'extra-id' });

    expect(result).toBe('AssetV1|update-id|extra-id');
  });

  it('should omit undefined extraId from the output', () => {
    const result = toAck({ type: SyncEntityType.AlbumV1, updateId: 'uid', extraId: undefined });

    expect(result).toBe('AlbumV1|uid');
  });
});

describe('fromAck and toAck round-trip', () => {
  it('should round-trip without extraId', () => {
    const original = 'UserDeleteV1|some-update-id';
    const ack = fromAck(original);
    const result = toAck(ack);

    expect(result).toBe(original);
  });

  it('should round-trip with extraId', () => {
    const original = 'PartnerV1|update-id|extra-id';
    const ack = fromAck(original);
    const result = toAck(ack);

    expect(result).toBe(original);
  });
});

describe('mapJsonLine', () => {
  it('should produce valid JSON followed by a newline', () => {
    const result = mapJsonLine({ hello: 'world' });

    expect(result).toBe('{"hello":"world"}\n');
  });

  it('should handle a string value', () => {
    const result = mapJsonLine('test');

    expect(result).toBe('"test"\n');
  });

  it('should handle a number value', () => {
    const result = mapJsonLine(42);

    expect(result).toBe('42\n');
  });

  it('should handle null', () => {
    const result = mapJsonLine(null);

    expect(result).toBe('null\n');
  });

  it('should handle an array', () => {
    const result = mapJsonLine([1, 2, 3]);

    expect(result).toBe('[1,2,3]\n');
  });

  it('should end with exactly one newline character', () => {
    const result = mapJsonLine({ key: 'value' });

    expect(result).toMatch(/\n$/);
    expect(result).not.toMatch(/\n\n$/);
  });
});

describe('serialize', () => {
  it('should produce a JSON line with type, data, and ack', () => {
    const result = serialize({
      type: SyncEntityType.UserDeleteV1,
      data: { userId: 'user-1' },
      ids: ['update-1'],
    });

    const parsed = JSON.parse(result);
    expect(parsed).toEqual({
      type: SyncEntityType.UserDeleteV1,
      data: { userId: 'user-1' },
      ack: 'UserDeleteV1|update-1',
    });
  });

  it('should include extraId in ack when two ids are provided', () => {
    const result = serialize({
      type: SyncEntityType.AssetDeleteV1,
      data: { assetId: 'asset-1' },
      ids: ['update-1', 'extra-1'],
    });

    const parsed = JSON.parse(result);
    expect(parsed.ack).toBe('AssetDeleteV1|update-1|extra-1');
  });

  it('should use ackType in the ack when provided', () => {
    const result = serialize({
      type: SyncEntityType.UserDeleteV1,
      data: { userId: 'user-1' },
      ids: ['update-1'],
      ackType: SyncEntityType.UserV1,
    });

    const parsed = JSON.parse(result);
    expect(parsed.ack).toBe('UserV1|update-1');
    expect(parsed.type).toBe(SyncEntityType.UserDeleteV1);
  });

  it('should end with a newline', () => {
    const result = serialize({
      type: SyncEntityType.UserDeleteV1,
      data: { userId: 'user-1' },
      ids: ['update-1'],
    });

    expect(result).toMatch(/\n$/);
  });
});
