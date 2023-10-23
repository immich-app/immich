import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsPositive, IsString } from 'class-validator';
import { Optional, ValidateUUID } from '../../domain.util';
import { BulkIdsDto } from '../response-dto';

export class AssetBulkUpdateDto extends BulkIdsDto {
  @Optional()
  @IsBoolean()
  isFavorite?: boolean;

  @Optional()
  @IsBoolean()
  isArchived?: boolean;

  @Optional()
  @ValidateUUID()
  stackParentId?: string;

  @Optional()
  @IsBoolean()
  removeParent?: boolean;
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
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  count?: number;
}

export enum TrashAction {
  EMPTY_ALL = 'empty-all',
  RESTORE_ALL = 'restore-all',
}

export class AssetBulkDeleteDto extends BulkIdsDto {
  @Optional()
  @IsBoolean()
  force?: boolean;
}
