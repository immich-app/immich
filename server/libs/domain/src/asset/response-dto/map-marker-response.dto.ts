import { AssetEntity } from "@app/infra/entities";
import { roundToDecimals } from 'apps/immich/src/utils/coordinate.util';

export type MapMarkerResponseDto = [
  // assetId
  string,
  // latitude
  number,
  // longitude
  number
];

export function mapAssetMapMarker(asset: AssetEntity, preload: boolean): MapMarkerResponseDto {
  const lat = asset.exifInfo?.latitude || 0;
  const lon = asset.exifInfo?.longitude || 0;

  const assetId = preload ? '' : asset.id;
  
  return  [
    assetId,
    roundToDecimals(lat, 5),
    roundToDecimals(lon, 5)
  ];
}
