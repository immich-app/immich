import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator';

export class CheckExistingAssetDto {
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  id!: string;

  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  checksum!: string;
}

export class CheckExistingAssetsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CheckExistingAssetDto)
  assets!: CheckExistingAssetDto[];
}
