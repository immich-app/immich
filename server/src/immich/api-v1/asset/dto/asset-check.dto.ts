import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator';

export class AssetBulkUploadCheckItem {
  @IsString()
  @IsNotEmpty()
  id!: string;

  /** base64 or hex encoded sha1 hash */
  @IsString()
  @IsNotEmpty()
  checksum!: string;
}

export class AssetBulkUploadCheckDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssetBulkUploadCheckItem)
  assets!: AssetBulkUploadCheckItem[];
}
