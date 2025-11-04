import { IsNotEmpty, IsString } from 'class-validator';
import { PluginActionName, PluginContext, PluginFilterName, PluginTrigger } from 'src/schema/tables/plugin.table';
import type { JSONSchema } from 'src/types/plugin-schema.types';

export class PluginResponseDto {
  id!: string;
  name!: string;
  displayName!: string;
  description!: string;
  author!: string;
  version!: string;
  manifestPath!: string;
  createdAt!: string;
  updatedAt!: string;
  triggers!: PluginTrigger[];
  filters!: PluginFilterResponseDto[];
  actions!: PluginActionResponseDto[];
}

export class PluginTriggerResponseDto {
  name!: string;
  description!: string;
  context!: PluginContext;
  schema!: JSONSchema | null;
}

export class PluginFilterResponseDto {
  id!: string;
  pluginId!: string;
  name!: PluginFilterName;
  displayName!: string;
  description!: string;
  supportedContexts!: PluginContext[];
  functionName!: string;
  schema!: JSONSchema | null;
}

export class PluginActionResponseDto {
  id!: string;
  pluginId!: string;
  name!: PluginActionName;
  displayName!: string;
  description!: string;
  supportedContexts!: PluginContext[];
  functionName!: string;
  schema!: JSONSchema | null;
}

export class PluginInstallDto {
  @IsString()
  @IsNotEmpty()
  manifestPath!: string;
}
