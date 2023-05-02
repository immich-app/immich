import { AssetEntity, AssetType } from '@app/infra/entities';
import { ApiProperty } from '@nestjs/swagger';

export class MapMarkerResponseDto {
  id!: string;

  @ApiProperty({ enumName: 'AssetTypeEnum', enum: AssetType })
  type!: AssetType;

  @ApiProperty({ type: 'number', format: 'double' })
  lat!: number;

  @ApiProperty({ type: 'number', format: 'double' })
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
