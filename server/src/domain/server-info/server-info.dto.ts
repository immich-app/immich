import { FeatureFlags, IVersion, type VersionType } from '@app/domain';
import { ApiProperty, ApiResponseProperty } from '@nestjs/swagger';
import type { DateTime } from 'luxon';
import { SystemConfigThemeDto } from '../system-config/dto/system-config-theme.dto';

export class ServerPingResponse {
  @ApiResponseProperty({ type: String, example: 'pong' })
  res!: string;
}

export class ServerInfoResponseDto {
  diskSize!: string;
  diskUse!: string;
  diskAvailable!: string;

  @ApiProperty({ type: 'integer', format: 'int64' })
  diskSizeRaw!: number;

  @ApiProperty({ type: 'integer', format: 'int64' })
  diskUseRaw!: number;

  @ApiProperty({ type: 'integer', format: 'int64' })
  diskAvailableRaw!: number;

  @ApiProperty({ type: 'number', format: 'float' })
  diskUsagePercentage!: number;
}

export class ServerVersionResponseDto implements IVersion {
  @ApiProperty({ type: 'integer' })
  major!: number;
  @ApiProperty({ type: 'integer' })
  minor!: number;
  @ApiProperty({ type: 'integer' })
  patch!: number;
}

export class UsageByUserDto {
  @ApiProperty({ type: 'string' })
  userId!: string;
  @ApiProperty({ type: 'string' })
  userName!: string;
  @ApiProperty({ type: 'integer' })
  photos!: number;
  @ApiProperty({ type: 'integer' })
  videos!: number;
  @ApiProperty({ type: 'integer', format: 'int64' })
  usage!: number;
  @ApiProperty({ type: 'integer', format: 'int64' })
  quotaSizeInBytes!: number | null;
}

export class ServerStatsResponseDto {
  @ApiProperty({ type: 'integer' })
  photos = 0;

  @ApiProperty({ type: 'integer' })
  videos = 0;

  @ApiProperty({ type: 'integer', format: 'int64' })
  usage = 0;

  @ApiProperty({
    isArray: true,
    type: UsageByUserDto,
    title: 'Array of usage for each user',
    example: [
      {
        photos: 1,
        videos: 1,
        diskUsageRaw: 1,
      },
    ],
  })
  usageByUser: UsageByUserDto[] = [];
}

export class ServerMediaTypesResponseDto {
  video!: string[];
  image!: string[];
  sidecar!: string[];
}

export class ServerThemeDto extends SystemConfigThemeDto {}

export class ServerConfigDto {
  oauthButtonText!: string;
  loginPageMessage!: string;
  @ApiProperty({ type: 'integer' })
  trashDays!: number;
  @ApiProperty({ type: 'integer' })
  userDeleteDelay!: number;
  isInitialized!: boolean;
  isOnboarded!: boolean;
  externalDomain!: string;
}

export class ServerFeaturesDto implements FeatureFlags {
  smartSearch!: boolean;
  configFile!: boolean;
  facialRecognition!: boolean;
  map!: boolean;
  trash!: boolean;
  reverseGeocoding!: boolean;
  oauth!: boolean;
  oauthAutoLaunch!: boolean;
  passwordLogin!: boolean;
  sidecar!: boolean;
  search!: boolean;
}

export interface ReleaseNotification {
  isAvailable: VersionType;
  checkedAt: DateTime<boolean> | null;
  serverVersion: ServerVersionResponseDto;
  releaseVersion: ServerVersionResponseDto;
}
