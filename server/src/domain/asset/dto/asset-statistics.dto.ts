import { AssetType } from '@app/infra/entities';
import { ApiProperty } from '@nestjs/swagger';
import { ValidateBoolean } from '../../domain.util';
import { AssetStats } from '../../repositories';

export class AssetStatsDto {
  @ValidateBoolean({ optional: true })
  isArchived?: boolean;

  @ValidateBoolean({ optional: true })
  isFavorite?: boolean;

  @ValidateBoolean({ optional: true })
  isTrashed?: boolean;
}

export class AssetStatsResponseDto {
  @ApiProperty({ type: 'integer' })
  images!: number;

  @ApiProperty({ type: 'integer' })
  videos!: number;

  @ApiProperty({ type: 'integer' })
  total!: number;
}

export const mapStats = (stats: AssetStats): AssetStatsResponseDto => {
  return {
    images: stats[AssetType.IMAGE],
    videos: stats[AssetType.VIDEO],
    total: Object.values(stats).reduce((total, value) => total + value, 0),
  };
};
