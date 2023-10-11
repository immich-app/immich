import { AssetType } from '@app/infra/entities';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean } from 'class-validator';
import { Optional, toBoolean } from '../../domain.util';
import { AssetStats } from '../../repositories';

export class AssetStatsDto {
  @IsBoolean()
  @Transform(toBoolean)
  @Optional()
  isArchived?: boolean;

  @IsBoolean()
  @Transform(toBoolean)
  @Optional()
  isFavorite?: boolean;

  @IsBoolean()
  @Transform(toBoolean)
  @Optional()
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
