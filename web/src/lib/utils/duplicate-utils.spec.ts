import { suggestDuplicate } from '$lib/utils/duplicate-utils';
import type { AssetResponseDto } from '@immich/sdk';

describe('choosing a duplicate', () => {
  it('picks the asset with the largest file size', () => {
    const assets = [
      { exifInfo: { fileSizeInByte: 300 } },
      { exifInfo: { fileSizeInByte: 200 } },
      { exifInfo: { fileSizeInByte: 100 } },
    ];
    expect(suggestDuplicate(assets as AssetResponseDto[])).toEqual(assets[0]);
  });

  it('picks the asset with the most exif data if multiple assets have the same file size', () => {
    const assets = [
      { exifInfo: { fileSizeInByte: 200, rating: 5, fNumber: 1 } },
      { exifInfo: { fileSizeInByte: 200, rating: 5 } },
      { exifInfo: { fileSizeInByte: 100, rating: 5 } },
    ];
    expect(suggestDuplicate(assets as AssetResponseDto[])).toEqual(assets[0]);
  });

  it('returns undefined for an empty array', () => {
    const assets: AssetResponseDto[] = [];
    expect(suggestDuplicate(assets)).toBeUndefined();
  });

  it('handles assets with no exifInfo', () => {
    const assets = [{ exifInfo: { fileSizeInByte: 200 } }, {}];
    expect(suggestDuplicate(assets as AssetResponseDto[])).toEqual(assets[0]);
  });

  it('handles assets with exifInfo but no fileSizeInByte', () => {
    const assets = [{ exifInfo: { rating: 5, fNumber: 1 } }, { exifInfo: { rating: 5 } }];
    expect(suggestDuplicate(assets as AssetResponseDto[])).toEqual(assets[0]);
  });
});
