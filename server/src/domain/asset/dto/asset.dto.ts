import { Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsPositive, IsString } from 'class-validator';
import { Optional } from '../../domain.util';
import { BulkIdsDto } from '../response-dto';

export class AssetBulkUpdateDto extends BulkIdsDto {
  @Optional()
  @IsBoolean()
  isFavorite?: boolean;

  @Optional()
  @IsBoolean()
  isArchived?: boolean;
}

export class UpdateAssetDto {
  @Optional()
  @IsBoolean()
  isFavorite?: boolean;

  @Optional()
  @IsBoolean()
  isArchived?: boolean;

  @Optional()
  @IsString()
  description?: string;
}

export class RandomAssetsDto {
  @Optional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  count?: number | null;
}
