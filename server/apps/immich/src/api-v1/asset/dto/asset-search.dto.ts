import { Transform } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { toBoolean } from '../../../utils/transform.util';

export class AssetSearchDto {
  @IsOptional()
  @IsNotEmpty()
  @IsBoolean()
  @Transform(toBoolean)
  isFavorite?: boolean;

  @IsOptional()
  @IsNotEmpty()
  @IsBoolean()
  @Transform(toBoolean)
  isArchived?: boolean;

  @IsOptional()
  @IsNumber()
  skip?: number;
}
