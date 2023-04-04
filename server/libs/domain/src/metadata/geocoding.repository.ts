export const IGeocodingRepository = 'IGeocodingRepository';

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface ReverseGeocodeResult {
  country: string;
  state: string;
  city: string;
}

export interface IGeocodingRepository {
  init(): Promise<void>;
  reverseGeocode(point: GeoPoint): Promise<ReverseGeocodeResult>;
}
