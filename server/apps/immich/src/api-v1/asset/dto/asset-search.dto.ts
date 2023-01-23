import { Type } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class AssetSearchDto {
  @IsOptional()
  @IsNotEmpty()
  @IsBoolean()
  @Type(() => Boolean)
  isFavorite?: boolean;

  @IsOptional()
  @IsNumber()
  skip?: number;
}
