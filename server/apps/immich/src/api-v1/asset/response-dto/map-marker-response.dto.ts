import { AssetEntity } from '@app/infra/entities';
import { round } from 'lodash';

export type MapMarkerResponseDto = [
  // latitude
  number,
  // longitude
  number,
  // assetId
  string?,
];

export function mapAssetMapMarker(asset: AssetEntity, preload: boolean): MapMarkerResponseDto {
  const lat = asset.exifInfo?.latitude || 0;
  const lon = asset.exifInfo?.longitude || 0;

  const response: MapMarkerResponseDto = [round(lat, 5), round(lon, 5)];

  if (!preload) {
    response.push(asset.id);
  }

  return response;
}
