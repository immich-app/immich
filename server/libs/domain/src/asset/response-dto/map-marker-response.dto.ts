import { AssetEntity } from "@app/infra/entities";

export type MapMarkerResponseDto = [
  // assetId
  string,
  // latitude
  number,
  // longitude
  number
];

export function mapAssetMapMarker(asset: AssetEntity): MapMarkerResponseDto {
  return [
    asset.id,
    asset.exifInfo?.latitude || 0,
    asset.exifInfo?.longitude || 0,
  ];
}
