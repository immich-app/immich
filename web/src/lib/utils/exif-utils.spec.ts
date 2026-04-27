import {
  getAppleMapsUrl,
  getExifCount,
  getGoogleMapsUrl,
  getMapProviderLinks,
  getOpenStreetMapUrl,
} from '$lib/utils/exif-utils';
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

describe('map provider urls', () => {
  it('builds Google Maps coordinate search urls', () => {
    expect(getGoogleMapsUrl(48.853_41, 2.3488)).toBe(
      'https://www.google.com/maps/search/?api=1&query=48.85341%2C2.3488',
    );
  });

  it('builds Apple Maps coordinate urls', () => {
    expect(getAppleMapsUrl(48.853_41, 2.3488)).toBe('https://maps.apple.com/?ll=48.85341%2C2.3488&q=48.85341%2C2.3488');
  });

  it('builds OpenStreetMap urls that preserve the existing marker and map zoom behavior', () => {
    expect(getOpenStreetMapUrl(48.853_41, 2.3488)).toBe(
      'https://www.openstreetmap.org/?mlat=48.85341&mlon=2.3488&zoom=13#map=15/48.85341/2.3488',
    );
  });

  it('builds provider links for negative coordinates', () => {
    expect(getMapProviderLinks(-33.8568, 151.2153)).toEqual([
      {
        key: 'google',
        label: 'open_in_google_maps',
        url: 'https://www.google.com/maps/search/?api=1&query=-33.8568%2C151.2153',
      },
      {
        key: 'apple',
        label: 'open_in_apple_maps',
        url: 'https://maps.apple.com/?ll=-33.8568%2C151.2153&q=-33.8568%2C151.2153',
      },
      {
        key: 'openStreetMap',
        label: 'open_in_openstreetmap',
        url: 'https://www.openstreetmap.org/?mlat=-33.8568&mlon=151.2153&zoom=13#map=15/-33.8568/151.2153',
      },
    ]);
  });
});
