import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export class StatsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  @ApiProperty({ default: 30, minimum: 1, maximum: 365 })
  sinceDays: number = 30;

  @IsOptional()
  @IsIn(['day', 'week', 'month'])
  @ApiProperty({ enum: ['day', 'week', 'month'], default: 'day' })
  granularity: 'day' | 'week' | 'month' = 'day';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @ApiProperty({ default: 10, minimum: 1, maximum: 100 })
  limit: number = 10;
}

export class TopAssetDto {
  @ApiProperty()
  assetId!: string;

  @ApiProperty()
  count!: number;
}

export class TimeBucketDto {
  @ApiProperty({ type: String, format: 'date-time' })
  bucket!: Date;

  @ApiProperty()
  count!: number;
}

export class DownloadOverviewDto {
  @ApiProperty()
  total!: number;

  @ApiProperty({ type: [TopAssetDto] })
  top!: TopAssetDto[];

  @ApiProperty({ type: [TimeBucketDto] })
  series!: TimeBucketDto[];
}

export class AssetDownloadCountDto {
  @ApiProperty()
  assetId!: string;

  @ApiProperty()
  count!: number;
}
