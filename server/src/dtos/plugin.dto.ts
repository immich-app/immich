import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { PluginAction, PluginFilter } from 'src/database';
import { PluginContext as PluginContextType, PluginTriggerType } from 'src/enum';
import type { JSONSchema } from 'src/types/plugin-schema.types';
import { ValidateEnum } from 'src/validation';

export class PluginTriggerResponseDto {
  @ValidateEnum({ enum: PluginTriggerType, name: 'PluginTriggerType', description: 'Trigger type' })
  type!: PluginTriggerType;
  @ValidateEnum({ enum: PluginContextType, name: 'PluginContextType', description: 'Context type' })
  contextType!: PluginContextType;
}

export class PluginResponseDto {
  @ApiProperty({ description: 'Plugin ID' })
  id!: string;
  @ApiProperty({ description: 'Plugin name' })
  name!: string;
  @ApiProperty({ description: 'Plugin title' })
  title!: string;
  @ApiProperty({ description: 'Plugin description' })
  description!: string;
  @ApiProperty({ description: 'Plugin author' })
  author!: string;
  @ApiProperty({ description: 'Plugin version' })
  version!: string;
  @ApiProperty({ description: 'Creation date' })
  createdAt!: string;
  @ApiProperty({ description: 'Last update date' })
  updatedAt!: string;
  @ApiProperty({ description: 'Plugin filters' })
  filters!: PluginFilterResponseDto[];
  @ApiProperty({ description: 'Plugin actions' })
  actions!: PluginActionResponseDto[];
}

export class PluginFilterResponseDto {
  @ApiProperty({ description: 'Filter ID' })
  id!: string;
  @ApiProperty({ description: 'Plugin ID' })
  pluginId!: string;
  @ApiProperty({ description: 'Method name' })
  methodName!: string;
  @ApiProperty({ description: 'Filter title' })
  title!: string;
  @ApiProperty({ description: 'Filter description' })
  description!: string;

  @ValidateEnum({ enum: PluginContextType, name: 'PluginContextType', each: true, description: 'Supported contexts' })
  supportedContexts!: PluginContextType[];
  @ApiProperty({ description: 'Filter schema' })
  schema!: JSONSchema | null;
}

export class PluginActionResponseDto {
  @ApiProperty({ description: 'Action ID' })
  id!: string;
  @ApiProperty({ description: 'Plugin ID' })
  pluginId!: string;
  @ApiProperty({ description: 'Method name' })
  methodName!: string;
  @ApiProperty({ description: 'Action title' })
  title!: string;
  @ApiProperty({ description: 'Action description' })
  description!: string;

  @ValidateEnum({ enum: PluginContextType, name: 'PluginContextType', each: true, description: 'Supported contexts' })
  supportedContexts!: PluginContextType[];
  @ApiProperty({ description: 'Action schema' })
  schema!: JSONSchema | null;
}

export class PluginInstallDto {
  @ApiProperty({ description: 'Path to plugin manifest file' })
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
