import { Transform } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { toBoolean } from '../../domain.utils';

export class AssetSearchDto {
  @IsOptional()
  @IsNotEmpty()
  @IsBoolean()
  @Transform(toBoolean)
  isFavorite?: boolean;

  @IsOptional()
  @IsNumber()
  skip?: number;
}
