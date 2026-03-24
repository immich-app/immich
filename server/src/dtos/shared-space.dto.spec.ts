import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { SharedSpaceAssetAddDto, SharedSpaceAssetRemoveDto } from 'src/dtos/shared-space.dto';

// Generates valid v4 UUIDs by varying the last 12 hex chars
const makeUUIDs = (count: number) =>
  Array.from({ length: count }, (_, i) => {
    const hex = i.toString(16).padStart(12, '0');
    return `3fe388e4-2078-44d7-b36c-${hex}`;
  });

describe('SharedSpaceAssetAddDto', () => {
  it('should accept an empty array', async () => {
    const dto = plainToInstance(SharedSpaceAssetAddDto, { assetIds: [] });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should accept a single asset ID', async () => {
    const dto = plainToInstance(SharedSpaceAssetAddDto, { assetIds: makeUUIDs(1) });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should accept 9,999 asset IDs', async () => {
    const dto = plainToInstance(SharedSpaceAssetAddDto, { assetIds: makeUUIDs(9999) });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should accept exactly 10,000 asset IDs', async () => {
    const dto = plainToInstance(SharedSpaceAssetAddDto, { assetIds: makeUUIDs(10_000) });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should reject 10,001 asset IDs', async () => {
    const dto = plainToInstance(SharedSpaceAssetAddDto, { assetIds: makeUUIDs(10_001) });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('SharedSpaceAssetRemoveDto', () => {
  it('should accept exactly 10,000 asset IDs', async () => {
    const dto = plainToInstance(SharedSpaceAssetRemoveDto, { assetIds: makeUUIDs(10_000) });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should reject 10,001 asset IDs', async () => {
    const dto = plainToInstance(SharedSpaceAssetRemoveDto, { assetIds: makeUUIDs(10_001) });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
