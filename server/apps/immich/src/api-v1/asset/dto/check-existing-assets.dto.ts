import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator';

export class CheckExistenceOfAssetDto {
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  id!: string;

  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  checksum!: string;
}

export class CheckExistenceOfAssetsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CheckExistenceOfAssetDto)
  assets!: CheckExistenceOfAssetDto[];
}
