import { IsBoolean } from 'class-validator';
import { BulkIdsDto } from '../response-dto';
import { Optional } from '../../domain.util';

export class AssetBulkUpdateDto extends BulkIdsDto {
  @Optional()
  @IsBoolean()
  isFavorite?: boolean;

  @Optional()
  @IsBoolean()
  isArchived?: boolean;
}
