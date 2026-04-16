import { createZodDto } from 'nestjs-zod';
import type { SemVer } from 'semver';
import { isoDatetimeToDate } from 'src/validation';
import z from 'zod';

const ServerPingResponseSchema = z
  .object({
    res: z.string().meta({ example: 'pong' }),
  })
  .meta({ id: 'ServerPingResponse' });

const ServerAboutResponseSchema = z
  .object({
    version: z.string().describe('Server version'),
    versionUrl: z.string().describe('URL to version information'),
    repository: z.string().optional().describe('Repository name'),
    repositoryUrl: z.string().optional().describe('Repository URL'),
    sourceRef: z.string().optional().describe('Source reference (branch/tag)'),
    sourceCommit: z.string().optional().describe('Source commit hash'),
    sourceUrl: z.string().optional().describe('Source URL'),
    build: z.string().optional().describe('Build identifier'),
    buildUrl: z.string().optional().describe('Build URL'),
    buildImage: z.string().optional().describe('Build image name'),
    buildImageUrl: z.string().optional().describe('Build image URL'),
    nodejs: z.string().optional().describe('Node.js version'),
    ffmpeg: z.string().optional().describe('FFmpeg version'),
    imagemagick: z.string().optional().describe('ImageMagick version'),
    libvips: z.string().optional().describe('libvips version'),
    exiftool: z.string().optional().describe('ExifTool version'),
    licensed: z.boolean().describe('Whether the server is licensed'),
    thirdPartySourceUrl: z.string().optional().describe('Third-party source URL'),
    thirdPartyBugFeatureUrl: z.string().optional().describe('Third-party bug/feature URL'),
    thirdPartyDocumentationUrl: z.string().optional().describe('Third-party documentation URL'),
    thirdPartySupportUrl: z.string().optional().describe('Third-party support URL'),
  })
  .meta({ id: 'ServerAboutResponseDto' });

const ServerApkLinksSchema = z
  .object({
    arm64v8a: z.string().describe('APK download link for ARM64 v8a architecture'),
    armeabiv7a: z.string().describe('APK download link for ARM EABI v7a architecture'),
    universal: z.string().describe('APK download link for universal architecture'),
    x86_64: z.string().describe('APK download link for x86_64 architecture'),
  })
  .meta({ id: 'ServerApkLinksDto' });

const ServerStorageResponseSchema = z
  .object({
    diskSize: z.string().describe('Total disk size (human-readable format)'),
    diskUse: z.string().describe('Used disk space (human-readable format)'),
    diskAvailable: z.string().describe('Available disk space (human-readable format)'),
    diskSizeRaw: z.int().describe('Total disk size in bytes'),
    diskUseRaw: z.int().describe('Used disk space in bytes'),
    diskAvailableRaw: z.int().describe('Available disk space in bytes'),
    diskUsagePercentage: z.number().meta({ format: 'double' }).describe('Disk usage percentage (0-100)'),
  })
  .meta({ id: 'ServerStorageResponseDto' });

const ServerVersionResponseSchema = z
  .object({
    major: z.int().describe('Major version number'),
    minor: z.int().describe('Minor version number'),
    patch: z.int().describe('Patch version number'),
  })
  .meta({ id: 'ServerVersionResponseDto' });

const ServerVersionHistoryResponseSchema = z
  .object({
    id: z.string().describe('Version history entry ID'),
    createdAt: isoDatetimeToDate.describe('When this version was first seen'),
    version: z.string().describe('Version string'),
  })
  .meta({ id: 'ServerVersionHistoryResponseDto' });

const UsageByUserSchema = z
  .object({
    userId: z.string().describe('User ID'),
    userName: z.string().describe('User name'),
    photos: z.int().describe('Number of photos'),
    videos: z.int().describe('Number of videos'),
    usage: z.int().describe('Total storage usage in bytes'),
    usagePhotos: z.int().describe('Storage usage for photos in bytes'),
    usageVideos: z.int().describe('Storage usage for videos in bytes'),
    quotaSizeInBytes: z.int().nullable().describe('User quota size in bytes (null if unlimited)'),
  })
  .meta({ id: 'UsageByUserDto' });

const ServerStatsResponseSchema = z
  .object({
    photos: z.int().describe('Total number of photos'),
    videos: z.int().describe('Total number of videos'),
    usage: z.int().describe('Total storage usage in bytes'),
    usagePhotos: z.int().describe('Storage usage for photos in bytes'),
    usageVideos: z.int().describe('Storage usage for videos in bytes'),
    usageByUser: z.array(UsageByUserSchema).describe('Array of usage for each user'),
  })
  .meta({ id: 'ServerStatsResponseDto' });

const ServerMediaTypesResponseSchema = z
  .object({
    video: z.array(z.string()).describe('Supported video MIME types'),
    image: z.array(z.string()).describe('Supported image MIME types'),
    sidecar: z.array(z.string()).describe('Supported sidecar MIME types'),
  })
  .meta({ id: 'ServerMediaTypesResponseDto' });

const ServerThemeSchema = z
  .object({
    customCss: z.string().describe('Custom CSS for theming'),
  })
  .meta({ id: 'ServerThemeDto' });

const ServerConfigSchema = z
  .object({
    oauthButtonText: z.string().describe('OAuth button text'),
    loginPageMessage: z.string().describe('Login page message'),
    trashDays: z.int().describe('Number of days before trashed assets are permanently deleted'),
    userDeleteDelay: z.int().describe('Delay in days before deleted users are permanently removed'),
    isInitialized: z.boolean().describe('Whether the server has been initialized'),
    isOnboarded: z.boolean().describe('Whether the admin has completed onboarding'),
    externalDomain: z.string().describe('External domain URL'),
    publicUsers: z.boolean().describe('Whether public user registration is enabled'),
    mapDarkStyleUrl: z.string().describe('Map dark style URL'),
    mapLightStyleUrl: z.string().describe('Map light style URL'),
    maintenanceMode: z.boolean().describe('Whether maintenance mode is active'),
  })
  .meta({ id: 'ServerConfigDto' });

const ServerFeaturesSchema = z
  .object({
    smartSearch: z.boolean().describe('Whether smart search is enabled'),
    duplicateDetection: z.boolean().describe('Whether duplicate detection is enabled'),
    configFile: z.boolean().describe('Whether config file is available'),
    facialRecognition: z.boolean().describe('Whether facial recognition is enabled'),
    map: z.boolean().describe('Whether map feature is enabled'),
    trash: z.boolean().describe('Whether trash feature is enabled'),
    reverseGeocoding: z.boolean().describe('Whether reverse geocoding is enabled'),
    importFaces: z.boolean().describe('Whether face import is enabled'),
    oauth: z.boolean().describe('Whether OAuth is enabled'),
    oauthAutoLaunch: z.boolean().describe('Whether OAuth auto-launch is enabled'),
    passwordLogin: z.boolean().describe('Whether password login is enabled'),
    sidecar: z.boolean().describe('Whether sidecar files are supported'),
    search: z.boolean().describe('Whether search is enabled'),
    email: z.boolean().describe('Whether email notifications are enabled'),
    ocr: z.boolean().describe('Whether OCR is enabled'),
  })
  .meta({ id: 'ServerFeaturesDto' });

export class ServerPingResponse extends createZodDto(ServerPingResponseSchema) {}
export class ServerAboutResponseDto extends createZodDto(ServerAboutResponseSchema) {}
export class ServerApkLinksDto extends createZodDto(ServerApkLinksSchema) {}
export class ServerStorageResponseDto extends createZodDto(ServerStorageResponseSchema) {}

export class ServerVersionResponseDto extends createZodDto(ServerVersionResponseSchema) {
  static fromSemVer(value: SemVer): z.infer<typeof ServerVersionResponseSchema> {
    return { major: value.major, minor: value.minor, patch: value.patch };
  }
}

export class ServerVersionHistoryResponseDto extends createZodDto(ServerVersionHistoryResponseSchema) {}
export class UsageByUserDto extends createZodDto(UsageByUserSchema) {}
export class ServerStatsResponseDto extends createZodDto(ServerStatsResponseSchema) {}
export class ServerMediaTypesResponseDto extends createZodDto(ServerMediaTypesResponseSchema) {}
export class ServerThemeDto extends createZodDto(ServerThemeSchema) {}
export class ServerConfigDto extends createZodDto(ServerConfigSchema) {}
export class ServerFeaturesDto extends createZodDto(ServerFeaturesSchema) {}

export interface ReleaseNotification {
  isAvailable: boolean;
  /** ISO8601 */
  checkedAt: string;
  serverVersion: ServerVersionResponseDto;
  releaseVersion: ServerVersionResponseDto;
}
