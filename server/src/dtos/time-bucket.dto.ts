import { ApiProperty } from '@nestjs/swagger';

import { IsEnum, IsInt, IsString, Min } from 'class-validator';
import { AssetOrder, AssetVisibility } from 'src/enum';
import { TimeBucketAssets, TimelineStack } from 'src/services/timeline.service.types';
import { Optional, ValidateAssetVisibility, ValidateBoolean, ValidateUUID } from 'src/validation';

export class TimeBucketDto {
  @ValidateUUID({ optional: true })
  userId?: string;

  @ValidateUUID({ optional: true })
  albumId?: string;

  @ValidateUUID({ optional: true })
  personId?: string;

  @ValidateUUID({ optional: true })
  tagId?: string;

  @ValidateBoolean({ optional: true })
  isFavorite?: boolean;

  @ValidateBoolean({ optional: true })
  isTrashed?: boolean;

  @ValidateBoolean({ optional: true })
  withStacked?: boolean;

  @ValidateBoolean({ optional: true })
  withPartners?: boolean;

  @IsEnum(AssetOrder)
  @Optional()
  @ApiProperty({ enum: AssetOrder, enumName: 'AssetOrder' })
  order?: AssetOrder;

  @ValidateAssetVisibility({ optional: true })
  visibility?: AssetVisibility;
}

export class TimeBucketAssetDto extends TimeBucketDto {
  @IsString()
  timeBucket!: string;

  @IsInt()
  @Min(1)
  @Optional()
  page?: number;

  @IsInt()
  @Min(1)
  @Optional()
  pageSize?: number;
}

export class TimelineStackResponseDto implements TimelineStack {
  id!: string;
  primaryAssetId!: string;
  assetCount!: number;
}

export class TimeBucketAssetResponseDto implements TimeBucketAssets {
  id!: string[];

  ownerId!: string[];

  ratio!: number[];

  isFavorite!: boolean[];

  @ApiProperty({ enum: AssetVisibility, enumName: 'AssetVisibility', isArray: true })
  visibility!: AssetVisibility[];

  isTrashed!: boolean[];

  isImage!: boolean[];

  @ApiProperty({ type: 'array', items: { type: 'string', nullable: true } })
  thumbhash!: (string | null)[];

  localDateTime!: string[];

  @ApiProperty({ type: 'array', items: { type: 'string', nullable: true } })
  duration!: (string | null)[];

  // id, count
  @ApiProperty({
    type: 'array',
    items: {
      type: 'array',
      items: { type: 'string' },
      minItems: 2,
      maxItems: 2,
      nullable: true,
    },
    description: '(stack ID, stack asset count) tuple',
  })
  stack?: ([string, string] | null)[];

  @ApiProperty({ type: 'array', items: { type: 'string', nullable: true } })
  projectionType!: (string | null)[];

  @ApiProperty({ type: 'array', items: { type: 'string', nullable: true } })
  livePhotoVideoId!: (string | null)[];

  @ApiProperty({ type: 'array', items: { type: 'string', nullable: true } })
  city!: (string | null)[];

  @ApiProperty({ type: 'array', items: { type: 'string', nullable: true } })
  country!: (string | null)[];
}

export class TimeBucketsResponseDto {
  @ApiProperty({ type: 'string' })
  timeBucket!: string;

  @ApiProperty({ type: 'integer' })
  count!: number;
}
