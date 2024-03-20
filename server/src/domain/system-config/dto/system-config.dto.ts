import { Type } from 'class-transformer';
import { IsObject, ValidateNested } from 'class-validator';
import { SystemConfigFFmpegDto } from 'src/domain/system-config/dto/system-config-ffmpeg.dto';
import { SystemConfigJobDto } from 'src/domain/system-config/dto/system-config-job.dto';
import { SystemConfigLibraryDto } from 'src/domain/system-config/dto/system-config-library.dto';
import { SystemConfigLoggingDto } from 'src/domain/system-config/dto/system-config-logging.dto';
import { SystemConfigMachineLearningDto } from 'src/domain/system-config/dto/system-config-machine-learning.dto';
import { SystemConfigMapDto } from 'src/domain/system-config/dto/system-config-map.dto';
import { SystemConfigNewVersionCheckDto } from 'src/domain/system-config/dto/system-config-new-version-check.dto';
import { SystemConfigOAuthDto } from 'src/domain/system-config/dto/system-config-oauth.dto';
import { SystemConfigPasswordLoginDto } from 'src/domain/system-config/dto/system-config-password-login.dto';
import { SystemConfigReverseGeocodingDto } from 'src/domain/system-config/dto/system-config-reverse-geocoding.dto';
import { SystemConfigServerDto } from 'src/domain/system-config/dto/system-config-server.dto';
import { SystemConfigStorageTemplateDto } from 'src/domain/system-config/dto/system-config-storage-template.dto';
import { SystemConfigThemeDto } from 'src/domain/system-config/dto/system-config-theme.dto';
import { SystemConfigThumbnailDto } from 'src/domain/system-config/dto/system-config-thumbnail.dto';
import { SystemConfigTrashDto } from 'src/domain/system-config/dto/system-config-trash.dto';
import { SystemConfigUserDto } from 'src/domain/system-config/dto/system-config-user.dto';
import { SystemConfig } from 'src/infra/entities/system-config.entity';

export class SystemConfigDto implements SystemConfig {
  @Type(() => SystemConfigFFmpegDto)
  @ValidateNested()
  @IsObject()
  ffmpeg!: SystemConfigFFmpegDto;

  @Type(() => SystemConfigLoggingDto)
  @ValidateNested()
  @IsObject()
  logging!: SystemConfigLoggingDto;

  @Type(() => SystemConfigMachineLearningDto)
  @ValidateNested()
  @IsObject()
  machineLearning!: SystemConfigMachineLearningDto;

  @Type(() => SystemConfigMapDto)
  @ValidateNested()
  @IsObject()
  map!: SystemConfigMapDto;

  @Type(() => SystemConfigNewVersionCheckDto)
  @ValidateNested()
  @IsObject()
  newVersionCheck!: SystemConfigNewVersionCheckDto;

  @Type(() => SystemConfigOAuthDto)
  @ValidateNested()
  @IsObject()
  oauth!: SystemConfigOAuthDto;

  @Type(() => SystemConfigPasswordLoginDto)
  @ValidateNested()
  @IsObject()
  passwordLogin!: SystemConfigPasswordLoginDto;

  @Type(() => SystemConfigReverseGeocodingDto)
  @ValidateNested()
  @IsObject()
  reverseGeocoding!: SystemConfigReverseGeocodingDto;

  @Type(() => SystemConfigStorageTemplateDto)
  @ValidateNested()
  @IsObject()
  storageTemplate!: SystemConfigStorageTemplateDto;

  @Type(() => SystemConfigJobDto)
  @ValidateNested()
  @IsObject()
  job!: SystemConfigJobDto;

  @Type(() => SystemConfigThumbnailDto)
  @ValidateNested()
  @IsObject()
  thumbnail!: SystemConfigThumbnailDto;

  @Type(() => SystemConfigTrashDto)
  @ValidateNested()
  @IsObject()
  trash!: SystemConfigTrashDto;

  @Type(() => SystemConfigThemeDto)
  @ValidateNested()
  @IsObject()
  theme!: SystemConfigThemeDto;

  @Type(() => SystemConfigLibraryDto)
  @ValidateNested()
  @IsObject()
  library!: SystemConfigLibraryDto;

  @Type(() => SystemConfigServerDto)
  @ValidateNested()
  @IsObject()
  server!: SystemConfigServerDto;

  @Type(() => SystemConfigUserDto)
  @ValidateNested()
  @IsObject()
  user!: SystemConfigUserDto;
}

export function mapConfig(config: SystemConfig): SystemConfigDto {
  return config;
}
