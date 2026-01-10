import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
  @ApiProperty({ description: 'WASM file path' })
  @IsString()
  @IsNotEmpty()
  path!: string;
}

class PluginManifestFilterDto {
  @ApiProperty({ description: 'Filter method name' })
  @IsString()
  @IsNotEmpty()
  methodName!: string;

  @ApiProperty({ description: 'Filter title' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ description: 'Filter description' })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({ description: 'Supported contexts', enum: PluginContext, isArray: true })
  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(PluginContext, { each: true })
  supportedContexts!: PluginContext[];

  @ApiPropertyOptional({ description: 'Filter schema' })
  @IsObject()
  @IsOptional()
  schema?: JSONSchema;
}

class PluginManifestActionDto {
  @ApiProperty({ description: 'Action method name' })
  @IsString()
  @IsNotEmpty()
  methodName!: string;

  @ApiProperty({ description: 'Action title' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ description: 'Action description' })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({ description: 'Supported contexts', enum: PluginContext, isArray: true })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateEnum({ enum: PluginContext, name: 'PluginContext', each: true })
  supportedContexts!: PluginContext[];

  @ApiPropertyOptional({ description: 'Action schema' })
  @IsObject()
  @IsOptional()
  schema?: JSONSchema;
}

export class PluginManifestDto {
  @ApiProperty({ description: 'Plugin name (lowercase, numbers, hyphens only)' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9-]+[a-z0-9]$/, {
    message: 'Plugin name must contain only lowercase letters, numbers, and hyphens, and cannot end with a hyphen',
  })
  name!: string;

  @ApiProperty({ description: 'Plugin version (semver)' })
  @IsString()
  @IsNotEmpty()
  @IsSemVer()
  version!: string;

  @ApiProperty({ description: 'Plugin title' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ description: 'Plugin description' })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({ description: 'Plugin author' })
  @IsString()
  @IsNotEmpty()
  author!: string;

  @ApiProperty({ description: 'WASM configuration', type: PluginManifestWasmDto })
  @ValidateNested()
  @Type(() => PluginManifestWasmDto)
  wasm!: PluginManifestWasmDto;

  @ApiPropertyOptional({ description: 'Plugin filters', type: () => [PluginManifestFilterDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PluginManifestFilterDto)
  @IsOptional()
  filters?: PluginManifestFilterDto[];

  @ApiPropertyOptional({ description: 'Plugin actions', type: () => [PluginManifestActionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PluginManifestActionDto)
  @IsOptional()
  actions?: PluginManifestActionDto[];
}
