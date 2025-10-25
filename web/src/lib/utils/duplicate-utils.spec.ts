import { DuplicateSelection } from '$lib/utils/duplicate-utils';
import type { AssetResponseDto } from '@immich/sdk';
import type { SourcePreference } from '$lib/stores/duplicate-tie-preferences';

const duplicateSelector = new DuplicateSelection();

const suggestDuplicate = (assets: AssetResponseDto[], pref = undefined) =>
  duplicateSelector.suggestDuplicate(assets, pref);

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

  it('respects source preference when provided', () => {
    const assets = [
      { exifInfo: { fileSizeInByte: 200 }, libraryId: null }, // internal
      { exifInfo: { fileSizeInByte: 200 }, libraryId: 'lib1' }, // external
    ];
    const preference: SourcePreference[] = [
      { variant: 'source', priority: 'external' },
    ];
    expect(duplicateSelector.suggestDuplicate(assets as AssetResponseDto[], preference)).toEqual(assets[1]);
  });

  it('falls back to size and exif when source preference yields no candidates', () => {
    const assets = [
      { exifInfo: { fileSizeInByte: 200 }, libraryId: null }, // internal
      { exifInfo: { fileSizeInByte: 200 }, libraryId: null }, // internal
    ];
    const preference: SourcePreference[] = [
      { variant: 'source', priority: 'external' },
    ];
    expect(duplicateSelector.suggestDuplicate(assets as AssetResponseDto[], preference)).toEqual(assets[0]);
  });


});
