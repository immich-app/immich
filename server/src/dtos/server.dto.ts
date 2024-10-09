import { ApiProperty, ApiResponseProperty } from '@nestjs/swagger';
import { SemVer } from 'semver';
import { SystemConfigThemeDto } from 'src/dtos/system-config.dto';

export class ServerPingResponse {
  @ApiResponseProperty({ type: String, example: 'pong' })
  res!: string;
}

export class ServerAboutResponseDto {
  version!: string;
  versionUrl!: string;

  repository?: string;
  repositoryUrl?: string;

  sourceRef?: string;
  sourceCommit?: string;
  sourceUrl?: string;

  build?: string;
  buildUrl?: string;
  buildImage?: string;
  buildImageUrl?: string;

  nodejs?: string;
  ffmpeg?: string;
  imagemagick?: string;
  libvips?: string;
  exiftool?: string;

  licensed!: boolean;

  thirdPartySourceUrl?: string;
  thirdPartyBugFeatureUrl?: string;
  thirdPartyDocumentationUrl?: string;
  thirdPartySupportUrl?: string;
}

export class ServerStorageResponseDto {
  diskSize!: string;
  diskUse!: string;
  diskAvailable!: string;

  @ApiProperty({ type: 'integer', format: 'int64' })
  diskSizeRaw!: number;

  @ApiProperty({ type: 'integer', format: 'int64' })
  diskUseRaw!: number;

  @ApiProperty({ type: 'integer', format: 'int64' })
  diskAvailableRaw!: number;

  @ApiProperty({ type: 'number', format: 'double' })
  diskUsagePercentage!: number;
}

export class ServerVersionResponseDto {
  @ApiProperty({ type: 'integer' })
  major!: number;
  @ApiProperty({ type: 'integer' })
  minor!: number;
  @ApiProperty({ type: 'integer' })
  patch!: number;

  static fromSemVer(value: SemVer) {
    return { major: value.major, minor: value.minor, patch: value.patch };
  }
}

export class ServerVersionHistoryResponseDto {
  id!: string;
  createdAt!: Date;
  version!: string;
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
  mapDarkStyleUrl!: string;
  mapLightStyleUrl!: string;
}

export class ServerFeaturesDto {
  smartSearch!: boolean;
  duplicateDetection!: boolean;
  configFile!: boolean;
  facialRecognition!: boolean;
  map!: boolean;
  trash!: boolean;
  reverseGeocoding!: boolean;
  importFaces!: boolean;
  oauth!: boolean;
  oauthAutoLaunch!: boolean;
  passwordLogin!: boolean;
  sidecar!: boolean;
  search!: boolean;
  email!: boolean;
}

export interface ReleaseNotification {
  isAvailable: boolean;
  /** ISO8601 */
  checkedAt: string;
  serverVersion: ServerVersionResponseDto;
  releaseVersion: ServerVersionResponseDto;
}
