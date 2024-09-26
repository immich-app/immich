export const IMapRepository = 'IMapRepository';

export interface MapMarkerSearchOptions {
  isArchived?: boolean;
  isFavorite?: boolean;
  fileCreatedBefore?: Date;
  fileCreatedAfter?: Date;
}

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface ReverseGeocodeResult {
  country: string | null;
  state: string | null;
  city: string | null;
}

export interface MapMarker extends ReverseGeocodeResult {
  id: string;
  lat: number;
  lon: number;
}

export interface IMapRepository {
  init(): Promise<void>;
  reverseGeocode(point: GeoPoint): Promise<ReverseGeocodeResult>;
  getMapMarkers(ownerIds: string[], albumIds: string[], options?: MapMarkerSearchOptions): Promise<MapMarker[]>;
  fetchStyle(url: string): Promise<any>;
}
