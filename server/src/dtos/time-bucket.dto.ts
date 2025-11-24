import { ApiProperty } from '@nestjs/swagger';

import { IsString } from 'class-validator';
import { AssetOrder, AssetVisibility } from 'src/enum';
import { ValidateBoolean, ValidateEnum, ValidateUUID } from 'src/validation';

export class TimeBucketDto {
  @ValidateUUID({ optional: true, description: 'Filter assets by specific user ID' })
  userId?: string;

  @ValidateUUID({ optional: true, description: 'Filter assets belonging to a specific album' })
  albumId?: string;

  @ValidateUUID({ optional: true, description: 'Filter assets containing a specific person (face recognition)' })
  personId?: string;

  @ValidateUUID({ optional: true, description: 'Filter assets with a specific tag' })
  tagId?: string;

  @ValidateBoolean({
    optional: true,
    description: 'Filter by favorite status (true for favorites only, false for non-favorites only)',
  })
  isFavorite?: boolean;

  @ValidateBoolean({
    optional: true,
    description: 'Filter by trash status (true for trashed assets only, false for non-trashed only)',
  })
  isTrashed?: boolean;

  @ValidateBoolean({
    optional: true,
    description: 'Include stacked assets in the response. When true, only primary assets from stacks are returned.',
  })
  withStacked?: boolean;

  @ValidateBoolean({ optional: true, description: 'Include assets shared by partners' })
  withPartners?: boolean;

  @ValidateEnum({
    enum: AssetOrder,
    name: 'AssetOrder',
    description: 'Sort order for assets within time buckets (ASC for oldest first, DESC for newest first)',
    optional: true,
  })
  order?: AssetOrder;

  @ValidateEnum({
    enum: AssetVisibility,
    name: 'AssetVisibility',
    optional: true,
    description: 'Filter by asset visibility status (ARCHIVE, TIMELINE, HIDDEN, LOCKED)',
  })
  visibility?: AssetVisibility;

  @ValidateBoolean({
    optional: true,
    description: 'Include location data in the response',
  })
  withCoordinates?: boolean;
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

  @ValidateEnum({
    enum: AssetVisibility,
    name: 'AssetVisibility',
    each: true,
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
    description: 'Array of file creation timestamps in UTC (ISO 8601 format, without timezone)',
  })
  fileCreatedAt!: string[];

  @ApiProperty({
    type: 'array',
    items: { type: 'number' },
    description:
      "Array of UTC offset hours at the time each photo was taken. Positive values are east of UTC, negative values are west of UTC. Values may be fractional (e.g., 5.5 for +05:30, -9.75 for -09:45). Applying this offset to 'fileCreatedAt' will give you the time the photo was taken from the photographer's perspective.",
  })
  localOffsetHours!: number[];

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

  @ApiProperty({
    type: 'array',
    required: false,
    items: { type: 'number', nullable: true },
    description: 'Array of latitude coordinates extracted from EXIF GPS data',
  })
  latitude!: number[];

  @ApiProperty({
    type: 'array',
    required: false,
    items: { type: 'number', nullable: true },
    description: 'Array of longitude coordinates extracted from EXIF GPS data',
  })
  longitude!: number[];
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
