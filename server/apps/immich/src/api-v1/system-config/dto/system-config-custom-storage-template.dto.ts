import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsEnum, IsNotEmpty, ValidateIf, ValidateNested } from 'class-validator';

export class SystemConfigCustomStorageTemplateDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StorageDateTemplate)
  @ArrayNotEmpty()
  template!: StorageDateTemplate[];
}

export enum StorageTemplateTypeEnum {
  datetime = 'datetime',
  literal = 'literal',
}

export class StorageDateTemplate {
  @IsNotEmpty()
  @IsEnum(StorageTemplateTypeEnum)
  @ApiProperty({ enumName: 'StorageTemplateTypeEnum', enum: StorageTemplateTypeEnum })
  type!: StorageTemplateTypeEnum;

  @ValidateIf((o) => o.type === StorageTemplateTypeEnum.datetime)
  @IsNotEmpty()
  key!: string;

  @IsNotEmpty()
  value!: string;
}
