import { IsBoolean } from 'class-validator';
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
