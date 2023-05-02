import { AssetEntity, AssetType } from '@app/infra/entities';

export class MapMarkerResponseDto {
  id!: string;
  type!: AssetType;
  lat!: number;
  lon!: number;
}

export function mapAssetMapMarker(entity: AssetEntity): MapMarkerResponseDto | null {
  if (!entity.exifInfo) {
    return null;
  }

  const lat = entity.exifInfo.latitude;
  const lon = entity.exifInfo.longitude;

  if (!lat || !lon) {
    return null;
  }

  return {
    id: entity.id,
    type: entity.type,
    lon,
    lat,
  };
}
