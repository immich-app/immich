import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { AssetOrder, AssetVisibility } from 'src/enum';
import { TimeBucketSize } from 'src/repositories/asset.repository';
import { Optional, ValidateAssetVisibility, ValidateBoolean, ValidateUUID } from 'src/validation';

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
}

export class TimeBucketResponseDto {
  @ApiProperty({ type: 'string' })
  timeBucket!: string;

  @ApiProperty({ type: 'integer' })
  count!: number;
}
