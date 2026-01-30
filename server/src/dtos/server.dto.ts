import { ApiProperty, ApiPropertyOptional, ApiResponseProperty } from '@nestjs/swagger';
import { SemVer } from 'semver';
import { SystemConfigThemeDto } from 'src/dtos/system-config.dto';

export class ServerPingResponse {
  @ApiResponseProperty({ type: String, example: 'pong' })
  res!: string;
}

export class ServerAboutResponseDto {
  @ApiProperty({ description: 'Server version' })
  version!: string;
  @ApiProperty({ description: 'URL to version information' })
  versionUrl!: string;

  @ApiPropertyOptional({ description: 'Repository name' })
  repository?: string;
  @ApiPropertyOptional({ description: 'Repository URL' })
  repositoryUrl?: string;

  @ApiPropertyOptional({ description: 'Source reference (branch/tag)' })
  sourceRef?: string;
  @ApiPropertyOptional({ description: 'Source commit hash' })
  sourceCommit?: string;
  @ApiPropertyOptional({ description: 'Source URL' })
  sourceUrl?: string;

  @ApiPropertyOptional({ description: 'Build identifier' })
  build?: string;
  @ApiPropertyOptional({ description: 'Build URL' })
  buildUrl?: string;
  @ApiPropertyOptional({ description: 'Build image name' })
  buildImage?: string;
  @ApiPropertyOptional({ description: 'Build image URL' })
  buildImageUrl?: string;

  @ApiPropertyOptional({ description: 'Node.js version' })
  nodejs?: string;
  @ApiPropertyOptional({ description: 'FFmpeg version' })
  ffmpeg?: string;
  @ApiPropertyOptional({ description: 'ImageMagick version' })
  imagemagick?: string;
  @ApiPropertyOptional({ description: 'libvips version' })
  libvips?: string;
  @ApiPropertyOptional({ description: 'ExifTool version' })
  exiftool?: string;

  @ApiProperty({ description: 'Whether the server is licensed' })
  licensed!: boolean;

  @ApiPropertyOptional({ description: 'Third-party source URL' })
  thirdPartySourceUrl?: string;
  @ApiPropertyOptional({ description: 'Third-party bug/feature URL' })
  thirdPartyBugFeatureUrl?: string;
  @ApiPropertyOptional({ description: 'Third-party documentation URL' })
  thirdPartyDocumentationUrl?: string;
  @ApiPropertyOptional({ description: 'Third-party support URL' })
  thirdPartySupportUrl?: string;
}

export class ServerApkLinksDto {
  @ApiProperty({ description: 'APK download link for ARM64 v8a architecture' })
  arm64v8a!: string;
  @ApiProperty({ description: 'APK download link for ARM EABI v7a architecture' })
  armeabiv7a!: string;
  @ApiProperty({ description: 'APK download link for universal architecture' })
  universal!: string;
  @ApiProperty({ description: 'APK download link for x86_64 architecture' })
  x86_64!: string;
}

export class ServerStorageResponseDto {
  @ApiProperty({ description: 'Total disk size (human-readable format)' })
  diskSize!: string;
  @ApiProperty({ description: 'Used disk space (human-readable format)' })
  diskUse!: string;
  @ApiProperty({ description: 'Available disk space (human-readable format)' })
  diskAvailable!: string;

  @ApiProperty({ type: 'integer', format: 'int64', description: 'Total disk size in bytes' })
  diskSizeRaw!: number;

  @ApiProperty({ type: 'integer', format: 'int64', description: 'Used disk space in bytes' })
  diskUseRaw!: number;

  @ApiProperty({ type: 'integer', format: 'int64', description: 'Available disk space in bytes' })
  diskAvailableRaw!: number;

  @ApiProperty({ type: 'number', format: 'double', description: 'Disk usage percentage (0-100)' })
  diskUsagePercentage!: number;
}

export class ServerVersionResponseDto {
  @ApiProperty({ type: 'integer', description: 'Major version number' })
  major!: number;
  @ApiProperty({ type: 'integer', description: 'Minor version number' })
  minor!: number;
  @ApiProperty({ type: 'integer', description: 'Patch version number' })
  patch!: number;

  static fromSemVer(value: SemVer) {
    return { major: value.major, minor: value.minor, patch: value.patch };
  }
}

export class ServerVersionHistoryResponseDto {
  @ApiProperty({ description: 'Version history entry ID' })
  id!: string;
  @ApiProperty({ description: 'When this version was first seen', format: 'date-time' })
  createdAt!: Date;
  @ApiProperty({ description: 'Version string' })
  version!: string;
}

export class UsageByUserDto {
  @ApiProperty({ type: 'string', description: 'User ID' })
  userId!: string;
  @ApiProperty({ type: 'string', description: 'User name' })
  userName!: string;
  @ApiProperty({ type: 'integer', description: 'Number of photos' })
  photos!: number;
  @ApiProperty({ type: 'integer', description: 'Number of videos' })
  videos!: number;
  @ApiProperty({ type: 'integer', format: 'int64', description: 'Total storage usage in bytes' })
  usage!: number;
  @ApiProperty({ type: 'integer', format: 'int64', description: 'Storage usage for photos in bytes' })
  usagePhotos!: number;
  @ApiProperty({ type: 'integer', format: 'int64', description: 'Storage usage for videos in bytes' })
  usageVideos!: number;
  @ApiProperty({
    type: 'integer',
    format: 'int64',
    nullable: true,
    description: 'User quota size in bytes (null if unlimited)',
  })
  quotaSizeInBytes!: number | null;
}

export class ServerStatsResponseDto {
  @ApiProperty({ type: 'integer', description: 'Total number of photos' })
  photos = 0;

  @ApiProperty({ type: 'integer', description: 'Total number of videos' })
  videos = 0;

  @ApiProperty({ type: 'integer', format: 'int64', description: 'Total storage usage in bytes' })
  usage = 0;

  @ApiProperty({ type: 'integer', format: 'int64', description: 'Storage usage for photos in bytes' })
  usagePhotos = 0;

  @ApiProperty({ type: 'integer', format: 'int64', description: 'Storage usage for videos in bytes' })
  usageVideos = 0;

  @ApiProperty({
    isArray: true,
    type: UsageByUserDto,
    title: 'Array of usage for each user',
    example: [
      {
        photos: 1,
        videos: 1,
        diskUsageRaw: 2,
        usagePhotos: 1,
        usageVideos: 1,
      },
    ],
  })
  usageByUser: UsageByUserDto[] = [];
}

export class ServerMediaTypesResponseDto {
  @ApiProperty({ description: 'Supported video MIME types' })
  video!: string[];
  @ApiProperty({ description: 'Supported image MIME types' })
  image!: string[];
  @ApiProperty({ description: 'Supported sidecar MIME types' })
  sidecar!: string[];
}

export class ServerThemeDto extends SystemConfigThemeDto {}

export class ServerConfigDto {
  @ApiProperty({ description: 'OAuth button text' })
  oauthButtonText!: string;
  @ApiProperty({ description: 'Login page message' })
  loginPageMessage!: string;
  @ApiProperty({ type: 'integer', description: 'Number of days before trashed assets are permanently deleted' })
  trashDays!: number;
  @ApiProperty({ type: 'integer', description: 'Delay in days before deleted users are permanently removed' })
  userDeleteDelay!: number;
  @ApiProperty({ description: 'Whether the server has been initialized' })
  isInitialized!: boolean;
  @ApiProperty({ description: 'Whether the admin has completed onboarding' })
  isOnboarded!: boolean;
  @ApiProperty({ description: 'External domain URL' })
  externalDomain!: string;
  @ApiProperty({ description: 'Whether public user registration is enabled' })
  publicUsers!: boolean;
  @ApiProperty({ description: 'Map dark style URL' })
  mapDarkStyleUrl!: string;
  @ApiProperty({ description: 'Map light style URL' })
  mapLightStyleUrl!: string;
  @ApiProperty({ description: 'Whether maintenance mode is active' })
  maintenanceMode!: boolean;
}

export class ServerFeaturesDto {
  @ApiProperty({ description: 'Whether smart search is enabled' })
  smartSearch!: boolean;
  @ApiProperty({ description: 'Whether duplicate detection is enabled' })
  duplicateDetection!: boolean;
  @ApiProperty({ description: 'Whether config file is available' })
  configFile!: boolean;
  @ApiProperty({ description: 'Whether facial recognition is enabled' })
  facialRecognition!: boolean;
  @ApiProperty({ description: 'Whether map feature is enabled' })
  map!: boolean;
  @ApiProperty({ description: 'Whether trash feature is enabled' })
  trash!: boolean;
  @ApiProperty({ description: 'Whether reverse geocoding is enabled' })
  reverseGeocoding!: boolean;
  @ApiProperty({ description: 'Whether face import is enabled' })
  importFaces!: boolean;
  @ApiProperty({ description: 'Whether OAuth is enabled' })
  oauth!: boolean;
  @ApiProperty({ description: 'Whether OAuth auto-launch is enabled' })
  oauthAutoLaunch!: boolean;
  @ApiProperty({ description: 'Whether password login is enabled' })
  passwordLogin!: boolean;
  @ApiProperty({ description: 'Whether sidecar files are supported' })
  sidecar!: boolean;
  @ApiProperty({ description: 'Whether search is enabled' })
  search!: boolean;
  @ApiProperty({ description: 'Whether email notifications are enabled' })
  email!: boolean;
  @ApiProperty({ description: 'Whether OCR is enabled' })
  ocr!: boolean;
}

export interface ReleaseNotification {
  isAvailable: boolean;
  /** ISO8601 */
  checkedAt: string;
  serverVersion: ServerVersionResponseDto;
  releaseVersion: ServerVersionResponseDto;
}
