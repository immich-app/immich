import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsSemVer,
  IsString,
  Matches,
  ValidateNested,
} from 'class-validator';
import { PluginContext } from 'src/enum';
import { JSONSchema } from 'src/types/plugin-schema.types';
import { ValidateEnum } from 'src/validation';

class PluginManifestWasmDto {
  @IsString()
  @IsNotEmpty()
  path!: string;
}

class PluginManifestFilterDto {
  @IsString()
  @IsNotEmpty()
  methodName!: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(PluginContext, { each: true })
  supportedContexts!: PluginContext[];

  @IsObject()
  @IsOptional()
  schema?: JSONSchema;
}

class PluginManifestActionDto {
  @IsString()
  @IsNotEmpty()
  methodName!: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateEnum({ enum: PluginContext, name: 'PluginContext', each: true })
  supportedContexts!: PluginContext[];

  @IsObject()
  @IsOptional()
  schema?: JSONSchema;
}

export class PluginManifestDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9-]+[a-z0-9]$/, {
    message: 'Plugin name must contain only lowercase letters, numbers, and hyphens, and cannot end with a hyphen',
  })
  name!: string;

  @IsString()
  @IsNotEmpty()
  @IsSemVer()
  version!: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsString()
  @IsNotEmpty()
  author!: string;

  @ValidateNested()
  @Type(() => PluginManifestWasmDto)
  wasm!: PluginManifestWasmDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PluginManifestFilterDto)
  @IsOptional()
  filters?: PluginManifestFilterDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PluginManifestActionDto)
  @IsOptional()
  actions?: PluginManifestActionDto[];
}
