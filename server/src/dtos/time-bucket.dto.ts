import { ApiProperty } from '@nestjs/swagger';

import { IsEnum, IsInt, IsNotEmpty, IsString, Min } from 'class-validator';
import { AssetOrder } from 'src/enum';
import { TimeBucketSize } from 'src/repositories/asset.repository';
import { TimeBucketAssets, TimelineStack } from 'src/services/timeline.service.types';
import { Optional, ValidateBoolean, ValidateUUID } from 'src/validation';

export class TimeBucketDto {
  @IsNotEmpty()
  @IsEnum(TimeBucketSize)
  @ApiProperty({ enum: TimeBucketSize, enumName: 'TimeBucketSize' })
  size!: TimeBucketSize;

  @ValidateUUID({ optional: true })
  userId?: string;

  @ValidateUUID({ optional: true })
  albumId?: string;

  @ValidateUUID({ optional: true })
  personId?: string;

  @ValidateUUID({ optional: true })
  tagId?: string;

  @ValidateBoolean({ optional: true })
  isArchived?: boolean;

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
}

export class TimeBucketAssetDto extends TimeBucketDto {
  @IsString()
  timeBucket!: string;

  @IsInt()
  @Min(1)
  @Optional()
  page?: number;

  @IsInt()
  @Optional()
  pageSize?: number;
}

export class TimelineStackResponseDto implements TimelineStack {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  primaryAssetId!: string;

  @ApiProperty()
  assetCount!: number;
}

export class TimeBucketAssetResponseDto implements TimeBucketAssets {
  @ApiProperty({ type: [String] })
  id: string[] = [];

  @ApiProperty({ type: [String] })
  ownerId: string[] = [];

  @ApiProperty()
  ratio: number[] = [];

  @ApiProperty()
  isFavorite: number[] = [];

  @ApiProperty()
  isArchived: number[] = [];

  @ApiProperty()
  isTrashed: number[] = [];

  @ApiProperty()
  isImage: number[] = [];

  @ApiProperty()
  isVideo: number[] = [];

  @ApiProperty({
    type: 'array',
    items: {
      oneOf: [
        {
          type: 'string',
        },
        {
          type: 'number',
        },
      ],
    },
  })
  thumbhash: (string | number)[] = [];

  @ApiProperty()
  localDateTime: Date[] = [];

  @ApiProperty({
    type: 'array',
    items: {
      oneOf: [
        {
          type: 'string',
        },
        {
          type: 'number',
        },
      ],
    },
  })
  duration: (string | number)[] = [];

  @ApiProperty({ type: [TimelineStackResponseDto] })
  stack: (TimelineStackResponseDto | number)[] = [];

  @ApiProperty({
    type: 'array',
    items: {
      oneOf: [
        {
          type: 'string',
        },
        {
          type: 'number',
        },
      ],
    },
  })
  projectionType: (string | number)[] = [];

  @ApiProperty({
    type: 'array',
    items: {
      oneOf: [
        {
          type: 'string',
        },
        {
          type: 'number',
        },
      ],
    },
  })
  livePhotoVideoId: (string | number)[] = [];
}

export class TimeBucketsResponseDto {
  @ApiProperty({ type: 'string' })
  timeBucket!: string;

  @ApiProperty({ type: 'integer' })
  count!: number;
}

export class TimeBucketResponseDto {
  @ApiProperty({ type: TimeBucketAssetResponseDto })
  bucketAssets!: TimeBucketAssetResponseDto;

  @ApiProperty()
  hasNextPage!: boolean;
}
