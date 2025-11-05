import { IsNotEmpty, IsString } from 'class-validator';
import { PluginContext } from 'src/schema/tables/plugin.table';
import type { JSONSchema } from 'src/types/plugin-schema.types';
import { ValidateEnum } from 'src/validation';

export class PluginResponseDto {
  id!: string;
  name!: string;
  displayName!: string;
  description!: string;
  author!: string;
  version!: string;
  wasmPath!: string;
  createdAt!: string;
  updatedAt!: string;
  triggers!: PluginTriggerResponseDto[];
  filters!: PluginFilterResponseDto[];
  actions!: PluginActionResponseDto[];
}

export class PluginTriggerResponseDto {
  name!: string;
  description!: string;

  @ValidateEnum({ enum: PluginContext, name: 'PluginContext' })
  context!: PluginContext;
  schema!: JSONSchema | null;
}

export class PluginFilterResponseDto {
  id!: string;
  pluginId!: string;
  name!: string;
  displayName!: string;
  description!: string;

  @ValidateEnum({ enum: PluginContext, name: 'PluginContext' })
  supportedContexts!: PluginContext[];
  schema!: JSONSchema | null;
}

export class PluginActionResponseDto {
  id!: string;
  pluginId!: string;
  name!: string;
  displayName!: string;
  description!: string;

  @ValidateEnum({ enum: PluginContext, name: 'PluginContext' })
  supportedContexts!: PluginContext[];
  schema!: JSONSchema | null;
}

export class PluginInstallDto {
  @IsString()
  @IsNotEmpty()
  manifestPath!: string;
}
