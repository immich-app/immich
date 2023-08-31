import { IsBoolean } from 'class-validator';
import { BulkIdsDto } from '../response-dto';
import { IsOptional } from '../../domain.util';

export class AssetBulkUpdateDto extends BulkIdsDto {
  @IsOptional()
  @IsBoolean()
  isFavorite?: boolean;

  @IsOptional()
  @IsBoolean()
  isArchived?: boolean;
}
