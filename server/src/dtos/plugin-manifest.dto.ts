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
import { PluginActionName, PluginContext, PluginFilterName, PluginTriggerName } from 'src/schema/tables/plugin.table';
import { JSONSchema } from 'src/types/plugin-schema.types';
import { ValidateEnum } from 'src/validation';

class PluginManifestWasmDto {
  @IsString()
  @IsNotEmpty()
  path!: string;
}

class PluginManifestTriggerDto {
  @ValidateEnum({ enum: PluginTriggerName, name: 'PluginTriggerName', optional: false })
  name!: PluginTriggerName;

  @IsString()
  @IsNotEmpty()
  displayName!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsEnum(PluginContext)
  context!: PluginContext;

  @IsString()
  @IsNotEmpty()
  functionName!: string;

  @IsObject()
  @IsOptional()
  schema?: JSONSchema;
}

class PluginManifestFilterDto {
  @ValidateEnum({ enum: PluginFilterName, name: 'PluginFilterName', optional: false })
  name!: PluginFilterName;

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

  @IsString()
  @IsNotEmpty()
  functionName!: string;

  @IsObject()
  @IsOptional()
  schema?: JSONSchema;
}

class PluginManifestActionDto {
  @ValidateEnum({ enum: PluginActionName, name: 'PluginActionName', optional: false })
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

  @IsString()
  @IsNotEmpty()
  functionName!: string;

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
  @Type(() => PluginManifestTriggerDto)
  @IsOptional()
  triggers?: PluginManifestTriggerDto[];

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
