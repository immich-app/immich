import { IsNotEmpty, IsString } from 'class-validator';
import { PluginAction, PluginFilter } from 'src/database';
import { PluginContext } from 'src/enum';
import type { JSONSchema } from 'src/types/plugin-schema.types';
import { ValidateEnum } from 'src/validation';

export class PluginResponseDto {
  id!: string;
  name!: string;
  title!: string;
  description!: string;
  author!: string;
  version!: string;
  createdAt!: string;
  updatedAt!: string;
  filters!: PluginFilterResponseDto[];
  actions!: PluginActionResponseDto[];
}

export class PluginFilterResponseDto {
  id!: string;
  pluginId!: string;
  methodName!: string;
  title!: string;
  description!: string;

  @ValidateEnum({ enum: PluginContext, name: 'PluginContext' })
  supportedContexts!: PluginContext[];
  schema!: JSONSchema | null;
}

export class PluginActionResponseDto {
  id!: string;
  pluginId!: string;
  methodName!: string;
  title!: string;
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

export type MapPlugin = {
  id: string;
  name: string;
  title: string;
  description: string;
  author: string;
  version: string;
  wasmPath: string;
  createdAt: Date;
  updatedAt: Date;
  filters: PluginFilter[];
  actions: PluginAction[];
};

export function mapPlugin(plugin: MapPlugin): PluginResponseDto {
  return {
    id: plugin.id,
    name: plugin.name,
    title: plugin.title,
    description: plugin.description,
    author: plugin.author,
    version: plugin.version,
    createdAt: plugin.createdAt.toISOString(),
    updatedAt: plugin.updatedAt.toISOString(),
    filters: plugin.filters,
    actions: plugin.actions,
  };
}
