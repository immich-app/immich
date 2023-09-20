import { IsBoolean, IsString } from 'class-validator';
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

export enum TrashAction {
  EMPTY_ALL = 'empty-all',
  RESTORE_ALL = 'restore-all',
}

export class AssetBulkDeleteDto extends BulkIdsDto {
  @Optional()
  @IsBoolean()
  force?: boolean;
}
