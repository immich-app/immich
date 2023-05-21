export const IGeocodingRepository = 'IGeocodingRepository';

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface ReverseGeocodeResult {
  country: string | null;
  state: string | null;
  city: string | null;
}

export interface IGeocodingRepository {
  init(): Promise<void>;
  reverseGeocode(point: GeoPoint): Promise<ReverseGeocodeResult>;
  deleteCache(): Promise<void>;
}
