import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsString } from 'class-validator';
import { Plugin } from 'src/database';
import { Optional, ValidateBoolean } from 'src/validation';

export class PluginSearchDto {
  @ValidateBoolean({ optional: true })
  isEnabled?: boolean;

  @ValidateBoolean({ optional: true })
  isTrusted?: boolean;

  @ValidateBoolean({ optional: true })
  isInstalled?: boolean;

  @IsString()
  @Optional()
  name?: string;
}

export class PluginImportDto {
  url!: string;
  install!: boolean;
  isEnabled!: boolean;
  isTrusted!: boolean;
}

export class PluginUpdateDto {
  @IsBoolean()
  isEnabled!: boolean;
}

export class PluginResponseDto {
  id!: string;
  createdAt!: Date;
  updatedAt!: Date;
  packageId!: string;
  @ApiProperty({ type: 'integer' })
  version!: number;
  name!: string;
  description!: string;
  isEnabled!: boolean;
  isInstalled!: boolean;
  isTrusted!: boolean;
}

export const mapPlugin = (plugin: Plugin): PluginResponseDto => ({
  id: plugin.id,
  createdAt: plugin.createdAt,
  updatedAt: plugin.updatedAt,
  packageId: plugin.packageId,
  version: plugin.version,
  name: plugin.name,
  description: plugin.description,
  isEnabled: plugin.isEnabled,
  isInstalled: plugin.isInstalled,
  isTrusted: plugin.isTrusted,
});
