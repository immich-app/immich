import { getExifCount } from '$lib/utils/exif-utils';
import type { AssetResponseDto } from '@immich/sdk';

describe('getting the exif count', () => {
  it('returns 0 when exifInfo is undefined', () => {
    const asset = {};
    expect(getExifCount(asset as AssetResponseDto)).toBe(0);
  });

  it('returns 0 when exifInfo is empty', () => {
    const asset = { exifInfo: {} };
    expect(getExifCount(asset as AssetResponseDto)).toBe(0);
  });

  it('returns the correct count of non-null exifInfo properties', () => {
    const asset = { exifInfo: { fileSizeInByte: 200, rating: 5, fNumber: null } };
    expect(getExifCount(asset as AssetResponseDto)).toBe(2);
  });

  it('ignores null, undefined and empty properties in exifInfo', () => {
    const asset = { exifInfo: { fileSizeInByte: 200, rating: null, fNumber: undefined, description: '' } };
    expect(getExifCount(asset as AssetResponseDto)).toBe(1);
  });

  it('returns the correct count when all exifInfo properties are non-null', () => {
    const asset = { exifInfo: { fileSizeInByte: 200, rating: 5, fNumber: 1, description: 'test' } };
    expect(getExifCount(asset as AssetResponseDto)).toBe(4);
  });
});
