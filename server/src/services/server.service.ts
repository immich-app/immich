import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { serverVersion } from 'src/constants';
import { OnEvent } from 'src/decorators';
import { AuthDto } from 'src/dtos/auth.dto';
import { LicenseKeyDto, LicenseResponseDto } from 'src/dtos/license.dto';
import {
  ServerAboutResponseDto,
  ServerApkLinksDto,
  ServerConfigDto,
  ServerFeaturesDto,
  ServerMediaTypesResponseDto,
  ServerPingResponse,
  ServerStatsResponseDto,
  ServerStorageResponseDto,
  UsageByUserDto,
} from 'src/dtos/server.dto';
import { SystemMetadataKey } from 'src/enum';
import { UserStatsQueryResponse } from 'src/repositories/user.repository';
import { BaseService } from 'src/services/base.service';
import { asHumanReadable } from 'src/utils/bytes';
import { mimeTypes } from 'src/utils/mime-types';
import {
  isDuplicateDetectionEnabled,
  isFacialRecognitionEnabled,
  isOcrEnabled,
  isSmartSearchEnabled,
} from 'src/utils/misc';

@Injectable()
export class ServerService extends BaseService {
  @OnEvent({ name: 'AppBootstrap' })
  async onBootstrap(): Promise<void> {
    const featureFlags = await this.getFeatures();
    if (featureFlags.configFile) {
      await this.systemMetadataRepository.set(SystemMetadataKey.AdminOnboarding, {
        isOnboarded: true,
      });
    }
    this.logger.log(`Feature Flags: ${JSON.stringify(await this.getFeatures(), null, 2)}`);
  }

  async getAboutInfo(): Promise<ServerAboutResponseDto> {
    const version = `v${serverVersion.toString()}`;
    const { buildMetadata } = this.configRepository.getEnv();
    const buildVersions = await this.serverInfoRepository.getBuildVersions();
    const licensed = await this.systemMetadataRepository.get(SystemMetadataKey.License);

    return {
      version,
      versionUrl: `https://github.com/immich-app/immich/releases/tag/${version}`,
      licensed: !!licensed,
      ...buildMetadata,
      ...buildVersions,
    };
  }

  getApkLinks(): ServerApkLinksDto {
    const baseUrl = `https://github.com/immich-app/immich/releases/download/v${serverVersion.toString()}`;
    return {
      arm64v8a: `${baseUrl}/app-arm64-v8a-release.apk`,
      armeabiv7a: `${baseUrl}/app-armeabi-v7a-release.apk`,
      universal: `${baseUrl}/app-release.apk`,
      x86_64: `${baseUrl}/app-x86_64-release.apk`,
    };
  }

  getStorage(auth: AuthDto): ServerStorageResponseDto {
    // Use per-user quota (default 1TB if not set)
    const ONE_TB = 1024 * 1024 * 1024 * 1024; // 1099511627776 bytes
    const quotaSize = auth.user.quotaSizeInBytes ?? ONE_TB;
    const quotaUsage = auth.user.quotaUsageInBytes;
    const quotaAvailable = Math.max(0, quotaSize - quotaUsage);

    const usagePercentage = ((quotaUsage / quotaSize) * 100).toFixed(2);

    const serverInfo = new ServerStorageResponseDto();
    serverInfo.diskAvailable = asHumanReadable(quotaAvailable);
    serverInfo.diskSize = asHumanReadable(quotaSize);
    serverInfo.diskUse = asHumanReadable(quotaUsage);
    serverInfo.diskAvailableRaw = quotaAvailable;
    serverInfo.diskSizeRaw = quotaSize;
    serverInfo.diskUseRaw = quotaUsage;
    serverInfo.diskUsagePercentage = Number.parseFloat(usagePercentage);
    return serverInfo;
  }

  ping(): ServerPingResponse {
    return { res: 'pong' };
  }

  async getFeatures(): Promise<ServerFeaturesDto> {
    const { reverseGeocoding, metadata, map, machineLearning, trash, oauth, passwordLogin, notifications } =
      await this.getConfig({ withCache: false });
    const { configFile } = this.configRepository.getEnv();

    return {
      smartSearch: isSmartSearchEnabled(machineLearning),
      facialRecognition: isFacialRecognitionEnabled(machineLearning),
      duplicateDetection: isDuplicateDetectionEnabled(machineLearning),
      map: map.enabled,
      reverseGeocoding: reverseGeocoding.enabled,
      importFaces: metadata.faces.import,
      sidecar: true,
      search: true,
      trash: trash.enabled,
      oauth: oauth.enabled,
      oauthAutoLaunch: oauth.autoLaunch,
      ocr: isOcrEnabled(machineLearning),
      passwordLogin: passwordLogin.enabled,
      configFile: !!configFile,
      email: notifications.smtp.enabled,
    };
  }

  async getTheme() {
    const { theme } = await this.getConfig({ withCache: false });
    return theme;
  }

  async getSystemConfig(): Promise<ServerConfigDto> {
    const { setup } = this.configRepository.getEnv();
    const config = await this.getConfig({ withCache: false });
    const isInitialized = !setup.allow || (await this.userRepository.hasAdmin());
    const onboarding = await this.systemMetadataRepository.get(SystemMetadataKey.AdminOnboarding);

    return {
      loginPageMessage: config.server.loginPageMessage,
      trashDays: config.trash.days,
      userDeleteDelay: config.user.deleteDelay,
      oauthButtonText: config.oauth.buttonText,
      isInitialized,
      isOnboarded: onboarding?.isOnboarded || false,
      externalDomain: config.server.externalDomain,
      publicUsers: config.server.publicUsers,
      mapDarkStyleUrl: config.map.darkStyle,
      mapLightStyleUrl: config.map.lightStyle,
      maintenanceMode: false,
    };
  }

  async getStatistics(): Promise<ServerStatsResponseDto> {
    const userStats: UserStatsQueryResponse[] = await this.userRepository.getUserStats();
    const serverStats = new ServerStatsResponseDto();

    for (const user of userStats) {
      const usage = new UsageByUserDto();
      usage.userId = user.userId;
      usage.userName = user.userName;
      usage.photos = user.photos;
      usage.videos = user.videos;
      usage.usage = user.usage;
      usage.usagePhotos = user.usagePhotos;
      usage.usageVideos = user.usageVideos;
      usage.quotaSizeInBytes = user.quotaSizeInBytes;

      serverStats.photos += usage.photos;
      serverStats.videos += usage.videos;
      serverStats.usage += usage.usage;
      serverStats.usagePhotos += usage.usagePhotos;
      serverStats.usageVideos += usage.usageVideos;

      serverStats.usageByUser.push(usage);
    }

    return serverStats;
  }

  getSupportedMediaTypes(): ServerMediaTypesResponseDto {
    return {
      video: Object.keys(mimeTypes.video),
      image: Object.keys(mimeTypes.image),
      sidecar: Object.keys(mimeTypes.sidecar),
    };
  }

  async deleteLicense(): Promise<void> {
    await this.systemMetadataRepository.delete(SystemMetadataKey.License);
  }

  async getLicense(): Promise<LicenseResponseDto> {
    const license = await this.systemMetadataRepository.get(SystemMetadataKey.License);
    if (!license) {
      throw new NotFoundException();
    }
    return license;
  }

  async setLicense(dto: LicenseKeyDto): Promise<LicenseResponseDto> {
    if (!dto.licenseKey.startsWith('IMSV-')) {
      throw new BadRequestException('Invalid license key');
    }
    const { licensePublicKey } = this.configRepository.getEnv();
    const licenseValid = this.cryptoRepository.verifySha256(dto.licenseKey, dto.activationKey, licensePublicKey.server);
    if (!licenseValid) {
      throw new BadRequestException('Invalid license key');
    }

    const licenseData = { ...dto, activatedAt: new Date() };

    await this.systemMetadataRepository.set(SystemMetadataKey.License, licenseData);

    return licenseData;
  }
}
