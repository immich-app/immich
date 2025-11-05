import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  ValidateNested,
} from 'class-validator';
import { PluginContext } from 'src/schema/tables/plugin.table';
import { JSONSchema } from 'src/types/plugin-schema.types';

class PluginManifestWasmDto {
  @IsString()
  @IsNotEmpty()
  path!: string;
}

class PluginManifestFilterDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  displayName!: string;

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
  name!: string;

  @IsString()
  @IsNotEmpty()
  displayName!: string;

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

export class PluginManifestDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Plugin name must contain only lowercase letters, numbers, and hyphens',
  })
  name!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d+\.\d+\.\d+$/, {
    message: 'Version must be in semantic versioning format (e.g., 1.0.0)',
  })
  version!: string;

  @IsString()
  @IsNotEmpty()
  displayName!: string;

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
