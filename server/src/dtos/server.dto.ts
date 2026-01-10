import { ApiProperty, ApiPropertyOptional, ApiResponseProperty } from '@nestjs/swagger';
import { SemVer } from 'semver';
import { SystemConfigThemeDto } from 'src/dtos/system-config.dto';

export class ServerPingResponse {
  @ApiResponseProperty({ type: String, example: 'pong' })
  res!: string;
}

export class ServerAboutResponseDto {
  @ApiProperty({ description: 'Server version', type: String })
  version!: string;
  @ApiProperty({ description: 'URL to version information', type: String })
  versionUrl!: string;

  @ApiPropertyOptional({ description: 'Repository name', type: String })
  repository?: string;
  @ApiPropertyOptional({ description: 'Repository URL', type: String })
  repositoryUrl?: string;

  @ApiPropertyOptional({ description: 'Source reference (branch/tag)', type: String })
  sourceRef?: string;
  @ApiPropertyOptional({ description: 'Source commit hash', type: String })
  sourceCommit?: string;
  @ApiPropertyOptional({ description: 'Source URL', type: String })
  sourceUrl?: string;

  @ApiPropertyOptional({ description: 'Build identifier', type: String })
  build?: string;
  @ApiPropertyOptional({ description: 'Build URL', type: String })
  buildUrl?: string;
  @ApiPropertyOptional({ description: 'Build image name', type: String })
  buildImage?: string;
  @ApiPropertyOptional({ description: 'Build image URL', type: String })
  buildImageUrl?: string;

  @ApiPropertyOptional({ description: 'Node.js version', type: String })
  nodejs?: string;
  @ApiPropertyOptional({ description: 'FFmpeg version', type: String })
  ffmpeg?: string;
  @ApiPropertyOptional({ description: 'ImageMagick version', type: String })
  imagemagick?: string;
  @ApiPropertyOptional({ description: 'libvips version', type: String })
  libvips?: string;
  @ApiPropertyOptional({ description: 'ExifTool version', type: String })
  exiftool?: string;

  @ApiProperty({ description: 'Whether the server is licensed', type: Boolean })
  licensed!: boolean;

  @ApiPropertyOptional({ description: 'Third-party source URL', type: String })
  thirdPartySourceUrl?: string;
  @ApiPropertyOptional({ description: 'Third-party bug/feature URL', type: String })
  thirdPartyBugFeatureUrl?: string;
  @ApiPropertyOptional({ description: 'Third-party documentation URL', type: String })
  thirdPartyDocumentationUrl?: string;
  @ApiPropertyOptional({ description: 'Third-party support URL', type: String })
  thirdPartySupportUrl?: string;
}

export class ServerApkLinksDto {
  @ApiProperty({ description: 'APK download link for ARM64 v8a architecture', type: String })
  arm64v8a!: string;
  @ApiProperty({ description: 'APK download link for ARM EABI v7a architecture', type: String })
  armeabiv7a!: string;
  @ApiProperty({ description: 'APK download link for universal architecture', type: String })
  universal!: string;
  @ApiProperty({ description: 'APK download link for x86_64 architecture', type: String })
  x86_64!: string;
}

export class ServerStorageResponseDto {
  @ApiProperty({ description: 'Total disk size (human-readable format)', type: String })
  diskSize!: string;
  @ApiProperty({ description: 'Used disk space (human-readable format)', type: String })
  diskUse!: string;
  @ApiProperty({ description: 'Available disk space (human-readable format)', type: String })
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
  @ApiProperty({ description: 'Version history entry ID', type: String })
  id!: string;
  @ApiProperty({ description: 'When this version was first seen', type: String, format: 'date-time' })
  createdAt!: Date;
  @ApiProperty({ description: 'Version string', type: String })
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
  @ApiProperty({ type: 'integer', format: 'int64', nullable: true, description: 'User quota size in bytes (null if unlimited)' })
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
  @ApiProperty({ description: 'Supported video MIME types', type: [String] })
  video!: string[];
  @ApiProperty({ description: 'Supported image MIME types', type: [String] })
  image!: string[];
  @ApiProperty({ description: 'Supported sidecar MIME types', type: [String] })
  sidecar!: string[];
}

export class ServerThemeDto extends SystemConfigThemeDto {}

export class ServerConfigDto {
  @ApiProperty({ description: 'OAuth button text', type: String })
  oauthButtonText!: string;
  @ApiProperty({ description: 'Login page message', type: String })
  loginPageMessage!: string;
  @ApiProperty({ type: 'integer', description: 'Number of days before trashed assets are permanently deleted' })
  trashDays!: number;
  @ApiProperty({ type: 'integer', description: 'Delay in days before deleted users are permanently removed' })
  userDeleteDelay!: number;
  @ApiProperty({ description: 'Whether the server has been initialized', type: Boolean })
  isInitialized!: boolean;
  @ApiProperty({ description: 'Whether the admin has completed onboarding', type: Boolean })
  isOnboarded!: boolean;
  @ApiProperty({ description: 'External domain URL', type: String })
  externalDomain!: string;
  @ApiProperty({ description: 'Whether public user registration is enabled', type: Boolean })
  publicUsers!: boolean;
  @ApiProperty({ description: 'Map dark style URL', type: String })
  mapDarkStyleUrl!: string;
  @ApiProperty({ description: 'Map light style URL', type: String })
  mapLightStyleUrl!: string;
  @ApiProperty({ description: 'Whether maintenance mode is active', type: Boolean })
  maintenanceMode!: boolean;
}

export class ServerFeaturesDto {
  @ApiProperty({ description: 'Whether smart search is enabled', type: Boolean })
  smartSearch!: boolean;
  @ApiProperty({ description: 'Whether duplicate detection is enabled', type: Boolean })
  duplicateDetection!: boolean;
  @ApiProperty({ description: 'Whether config file is available', type: Boolean })
  configFile!: boolean;
  @ApiProperty({ description: 'Whether facial recognition is enabled', type: Boolean })
  facialRecognition!: boolean;
  @ApiProperty({ description: 'Whether map feature is enabled', type: Boolean })
  map!: boolean;
  @ApiProperty({ description: 'Whether trash feature is enabled', type: Boolean })
  trash!: boolean;
  @ApiProperty({ description: 'Whether reverse geocoding is enabled', type: Boolean })
  reverseGeocoding!: boolean;
  @ApiProperty({ description: 'Whether face import is enabled', type: Boolean })
  importFaces!: boolean;
  @ApiProperty({ description: 'Whether OAuth is enabled', type: Boolean })
  oauth!: boolean;
  @ApiProperty({ description: 'Whether OAuth auto-launch is enabled', type: Boolean })
  oauthAutoLaunch!: boolean;
  @ApiProperty({ description: 'Whether password login is enabled', type: Boolean })
  passwordLogin!: boolean;
  @ApiProperty({ description: 'Whether sidecar files are supported', type: Boolean })
  sidecar!: boolean;
  @ApiProperty({ description: 'Whether search is enabled', type: Boolean })
  search!: boolean;
  @ApiProperty({ description: 'Whether email notifications are enabled', type: Boolean })
  email!: boolean;
  @ApiProperty({ description: 'Whether OCR is enabled', type: Boolean })
  ocr!: boolean;
}

export interface ReleaseNotification {
  isAvailable: boolean;
  /** ISO8601 */
  checkedAt: string;
  serverVersion: ServerVersionResponseDto;
  releaseVersion: ServerVersionResponseDto;
}
