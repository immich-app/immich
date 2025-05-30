import { ApiProperty } from '@nestjs/swagger';

import { IsEnum, IsString } from 'class-validator';
import { AssetOrder, AssetVisibility } from 'src/enum';
import { Optional, ValidateAssetVisibility, ValidateBoolean, ValidateUUID } from 'src/validation';

export class TimeBucketDto {
  @ApiProperty({
    type: 'string',
    format: 'uuid',
    required: false,
    description: 'Filter assets by specific user ID',
  })
  @ValidateUUID({ optional: true })
  userId?: string;

  @ApiProperty({
    type: 'string',
    format: 'uuid',
    required: false,
    description: 'Filter assets belonging to a specific album',
  })
  @ValidateUUID({ optional: true })
  albumId?: string;

  @ApiProperty({
    type: 'string',
    format: 'uuid',
    required: false,
    description: 'Filter assets containing a specific person (face recognition)',
  })
  @ValidateUUID({ optional: true })
  personId?: string;

  @ApiProperty({
    type: 'string',
    format: 'uuid',
    required: false,
    description: 'Filter assets with a specific tag',
  })
  @ValidateUUID({ optional: true })
  tagId?: string;

  @ApiProperty({
    type: 'boolean',
    required: false,
    description: 'Filter by favorite status (true for favorites only, false for non-favorites only)',
  })
  @ValidateBoolean({ optional: true })
  isFavorite?: boolean;

  @ApiProperty({
    type: 'boolean',
    required: false,
    description: 'Filter by trash status (true for trashed assets only, false for non-trashed only)',
  })
  @ValidateBoolean({ optional: true })
  isTrashed?: boolean;

  @ApiProperty({
    type: 'boolean',
    required: false,
    description: 'Include stacked assets in the response. When true, only primary assets from stacks are returned.',
  })
  @ValidateBoolean({ optional: true })
  withStacked?: boolean;

  @ApiProperty({
    type: 'boolean',
    required: false,
    description: 'Include assets shared by partners',
  })
  @ValidateBoolean({ optional: true })
  withPartners?: boolean;

  @IsEnum(AssetOrder)
  @Optional()
  @ApiProperty({
    enum: AssetOrder,
    enumName: 'AssetOrder',
    required: false,
    description: 'Sort order for assets within time buckets (ASC for oldest first, DESC for newest first)',
  })
  order?: AssetOrder;

  @ApiProperty({
    enum: AssetVisibility,
    enumName: 'AssetVisibility',
    required: false,
    description: 'Filter by asset visibility status (ARCHIVE, TIMELINE, HIDDEN, LOCKED)',
  })
  @ValidateAssetVisibility({ optional: true })
  visibility?: AssetVisibility;
}

export class TimeBucketAssetDto extends TimeBucketDto {
  @ApiProperty({
    type: 'string',
    description: 'Time bucket identifier in YYYY-MM-DD format (e.g., "2024-01-01" for January 2024)',
    example: '2024-01-01',
  })
  @IsString()
  timeBucket!: string;
}

export class TimelineStackResponseDto {
  @ApiProperty({
    type: 'string',
    description: 'Unique identifier for the asset stack',
  })
  id!: string;

  @ApiProperty({
    type: 'string',
    description: 'Asset ID of the primary (representative) asset in the stack',
  })
  primaryAssetId!: string;

  @ApiProperty({
    type: 'integer',
    description: 'Total number of assets in this stack',
  })
  assetCount!: number;
}

export class TimeBucketAssetResponseDto {
  @ApiProperty({
    type: 'array',
    items: { type: 'string' },
    description: 'Array of asset IDs in the time bucket',
  })
  id!: string[];

  @ApiProperty({
    type: 'array',
    items: { type: 'string' },
    description: 'Array of owner IDs for each asset',
  })
  ownerId!: string[];

  @ApiProperty({
    type: 'array',
    items: { type: 'number' },
    description: 'Array of aspect ratios (width/height) for each asset',
  })
  ratio!: number[];

  @ApiProperty({
    type: 'array',
    items: { type: 'boolean' },
    description: 'Array indicating whether each asset is favorited',
  })
  isFavorite!: boolean[];

  @ApiProperty({
    enum: AssetVisibility,
    enumName: 'AssetVisibility',
    isArray: true,
    description: 'Array of visibility statuses for each asset (e.g., ARCHIVE, TIMELINE, HIDDEN, LOCKED)',
  })
  visibility!: AssetVisibility[];

  @ApiProperty({
    type: 'array',
    items: { type: 'boolean' },
    description: 'Array indicating whether each asset is in the trash',
  })
  isTrashed!: boolean[];

  @ApiProperty({
    type: 'array',
    items: { type: 'boolean' },
    description: 'Array indicating whether each asset is an image (false for videos)',
  })
  isImage!: boolean[];

  @ApiProperty({
    type: 'array',
    items: { type: 'string', nullable: true },
    description: 'Array of BlurHash strings for generating asset previews (base64 encoded)',
  })
  thumbhash!: (string | null)[];

  @ApiProperty({
    type: 'array',
    items: { type: 'string' },
    description: 'Array of file creation timestamps in UTC (ISO 8601 format)',
  })
  fileCreatedAt!: string[];

  @ApiProperty({
    type: 'array',
    items: { type: 'integer' },
    description:
      "Array of UTC offset minutes at the time each photo was taken. Positive values are east of UTC, negative values are west of UTC. Applying this offset to 'fileCreatedAt' will give you the time the photo was taken from the photographer's perspective.",
  })
  localOffsetMinutes!: number[];

  @ApiProperty({
    type: 'array',
    items: { type: 'string', nullable: true },
    description: 'Array of video durations in HH:MM:SS format (null for images)',
  })
  duration!: (string | null)[];

  @ApiProperty({
    type: 'array',
    items: {
      type: 'array',
      items: { type: 'string' },
      minItems: 2,
      maxItems: 2,
      nullable: true,
    },
    description: 'Array of stack information as [stackId, assetCount] tuples (null for non-stacked assets)',
  })
  stack?: ([string, string] | null)[];

  @ApiProperty({
    type: 'array',
    items: { type: 'string', nullable: true },
    description: 'Array of projection types for 360° content (e.g., "EQUIRECTANGULAR", "CUBEFACE", "CYLINDRICAL")',
  })
  projectionType!: (string | null)[];

  @ApiProperty({
    type: 'array',
    items: { type: 'string', nullable: true },
    description: 'Array of live photo video asset IDs (null for non-live photos)',
  })
  livePhotoVideoId!: (string | null)[];

  @ApiProperty({
    type: 'array',
    items: { type: 'string', nullable: true },
    description: 'Array of city names extracted from EXIF GPS data',
  })
  city!: (string | null)[];

  @ApiProperty({
    type: 'array',
    items: { type: 'string', nullable: true },
    description: 'Array of country names extracted from EXIF GPS data',
  })
  country!: (string | null)[];
}

export class TimeBucketsResponseDto {
  @ApiProperty({
    type: 'string',
    description: 'Time bucket identifier in YYYY-MM-DD format representing the start of the time period',
    example: '2024-01-01',
  })
  timeBucket!: string;

  @ApiProperty({
    type: 'integer',
    description: 'Number of assets in this time bucket',
    example: 42,
  })
  count!: number;
}
