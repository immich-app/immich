import type { AssetResponseDto } from '@immich/sdk';

export const getExifCount = (asset: AssetResponseDto) => {
  return Object.values(asset.exifInfo ?? {}).filter(Boolean).length;
};

const coordinates = (lat: number, lon: number) => `${lat},${lon}`;

type MapProviderLink = {
  key: 'google' | 'apple' | 'openStreetMap';
  label: 'open_in_google_maps' | 'open_in_apple_maps' | 'open_in_openstreetmap';
  url: string;
};

export const getGoogleMapsUrl = (lat: number, lon: number) => {
  const url = new URL('https://www.google.com/maps/search/');
  url.searchParams.set('api', '1');
  url.searchParams.set('query', coordinates(lat, lon));
  return url.toString();
};

export const getAppleMapsUrl = (lat: number, lon: number) => {
  const url = new URL('https://maps.apple.com/');
  url.searchParams.set('ll', coordinates(lat, lon));
  url.searchParams.set('q', coordinates(lat, lon));
  return url.toString();
};

export const getOpenStreetMapUrl = (lat: number, lon: number) => {
  const url = new URL('https://www.openstreetmap.org/');
  url.searchParams.set('mlat', String(lat));
  url.searchParams.set('mlon', String(lon));
  url.searchParams.set('zoom', '13');
  url.hash = `map=15/${lat}/${lon}`;
  return url.toString();
};

export const getMapProviderLinks = (lat: number, lon: number): MapProviderLink[] => [
  {
    key: 'google',
    label: 'open_in_google_maps',
    url: getGoogleMapsUrl(lat, lon),
  },
  {
    key: 'apple',
    label: 'open_in_apple_maps',
    url: getAppleMapsUrl(lat, lon),
  },
  {
    key: 'openStreetMap',
    label: 'open_in_openstreetmap',
    url: getOpenStreetMapUrl(lat, lon),
  },
];
