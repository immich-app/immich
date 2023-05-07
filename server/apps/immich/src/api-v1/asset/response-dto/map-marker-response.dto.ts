import { AssetEntity } from '@app/infra/entities';
import { roundToDecimals } from '../../../utils/coordinate.util';

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

  const response = [roundToDecimals(lat, 5), roundToDecimals(lon, 5)] as MapMarkerResponseDto;

  if (!preload) {
    response.push(asset.id);
  }

  return response;
}
