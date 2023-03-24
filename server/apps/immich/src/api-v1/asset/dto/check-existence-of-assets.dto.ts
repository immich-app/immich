import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator';

export class CheckExistenceOfAssetByChecksumDto {
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  id!: string;

  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  checksum!: string;
}

export class CheckExistenceOfAssetsByChecksumDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CheckExistenceOfAssetByChecksumDto)
  assets!: CheckExistenceOfAssetByChecksumDto[];
}
