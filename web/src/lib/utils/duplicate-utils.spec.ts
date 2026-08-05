import type { AssetResponseDto, ExifResponseDto } from '@immich/sdk';
import { computeDifferingMetadataFields, countDifferingMetadataItems } from '$lib/utils/duplicate-utils';
import { assetFactory } from '@test-data/factories/asset-factory';

// Derives both assets from a single base so that everything except `exifInfo` is identical,
// leaving the field under test as the only possible difference.
const buildPair = (first: ExifResponseDto, second: ExifResponseDto): AssetResponseDto[] => {
  const base = assetFactory.build();
  return [
    { ...base, id: 'first-asset', exifInfo: first },
    { ...base, id: 'second-asset', exifInfo: second },
  ];
};

describe('computeDifferingMetadataFields', () => {
  it('flags coordinates when only one asset has them', () => {
    const assets = buildPair({ latitude: 48.8583, longitude: 2.2944 }, {});

    const diffs = computeDifferingMetadataFields(assets);

    expect(diffs.latitude).toBe(true);
    expect(diffs.longitude).toBe(true);
  });

  it('does not flag coordinates when neither asset has them', () => {
    const assets = buildPair({}, {});

    const diffs = computeDifferingMetadataFields(assets);

    expect(diffs.latitude).toBe(false);
    expect(diffs.longitude).toBe(false);
  });

  it('does not flag coordinates when both assets share them', () => {
    const coordinates = { latitude: 48.8583, longitude: 2.2944 };
    const assets = buildPair(coordinates, { ...coordinates });

    const diffs = computeDifferingMetadataFields(assets);

    expect(diffs.latitude).toBe(false);
    expect(diffs.longitude).toBe(false);
  });

  it('flags coordinates when the assets disagree', () => {
    const assets = buildPair({ latitude: 48.8583, longitude: 2.2944 }, { latitude: 41.8902, longitude: 12.4922 });

    const diffs = computeDifferingMetadataFields(assets);

    expect(diffs.latitude).toBe(true);
    expect(diffs.longitude).toBe(true);
  });

  it('treats an explicit null the same as an absent field', () => {
    const assets = buildPair({ description: null }, {});

    const diffs = computeDifferingMetadataFields(assets);

    expect(diffs.description).toBe(false);
  });

  it('treats an empty string the same as an absent field', () => {
    const assets = buildPair({ description: '' }, { description: null });

    const diffs = computeDifferingMetadataFields(assets);

    expect(diffs.description).toBe(false);
  });

  it('flags other nullable fields present on only one asset', () => {
    const assets = buildPair({ rating: 4, lensModel: 'EF24-70mm f/2.8L II USM', make: 'Canon' }, {});

    const diffs = computeDifferingMetadataFields(assets);

    expect(diffs.rating).toBe(true);
    expect(diffs.lensModel).toBe(true);
    expect(diffs.make).toBe(true);
  });
});

describe('countDifferingMetadataItems', () => {
  it('counts a field that only one asset has', () => {
    const assets = buildPair({ latitude: 48.8583, longitude: 2.2944 }, {});

    const diffs = computeDifferingMetadataFields(assets);

    // latitude and longitude belong to the single "gps" field
    expect(countDifferingMetadataItems(diffs)).toBe(1);
  });
});
