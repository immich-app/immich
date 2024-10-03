import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { serverVersion } from 'src/constants';
import { StorageCore } from 'src/cores/storage.core';
import { OnEvent } from 'src/decorators';
import { LicenseKeyDto, LicenseResponseDto } from 'src/dtos/license.dto';
import {
  ServerAboutResponseDto,
  ServerConfigDto,
  ServerFeaturesDto,
  ServerMediaTypesResponseDto,
  ServerPingResponse,
  ServerStatsResponseDto,
  ServerStorageResponseDto,
  UsageByUserDto,
} from 'src/dtos/server.dto';
import { StorageFolder, SystemMetadataKey } from 'src/enum';
import { UserStatsQueryResponse } from 'src/interfaces/user.interface';
import { BaseService } from 'src/services/base.service';
import { asHumanReadable } from 'src/utils/bytes';
import { mimeTypes } from 'src/utils/mime-types';
import { isDuplicateDetectionEnabled, isFacialRecognitionEnabled, isSmartSearchEnabled } from 'src/utils/misc';

@Injectable()
export class ServerService extends BaseService {
  @OnEvent({ name: 'app.bootstrap' })
  async onBootstrap(): Promise<void> {
    const featureFlags = await this.getFeatures();
    if (featureFlags.configFile) {
      await this.systemMetadataRepository.set(SystemMetadataKey.ADMIN_ONBOARDING, {
        isOnboarded: true,
      });
    }
    this.logger.log(`Feature Flags: ${JSON.stringify(await this.getFeatures(), null, 2)}`);
  }

  async getAboutInfo(): Promise<ServerAboutResponseDto> {
    const version = `v${serverVersion.toString()}`;
    const { buildMetadata } = this.configRepository.getEnv();
    const buildVersions = await this.serverInfoRepository.getBuildVersions();
    const licensed = await this.systemMetadataRepository.get(SystemMetadataKey.LICENSE);

    return {
      version,
      versionUrl: `https://github.com/immich-app/immich/releases/tag/${version}`,
      licensed: !!licensed,
      ...buildMetadata,
      ...buildVersions,
    };
  }

  async getStorage(): Promise<ServerStorageResponseDto> {
    const libraryBase = StorageCore.getBaseFolder(StorageFolder.LIBRARY);
    const diskInfo = await this.storageRepository.checkDiskUsage(libraryBase);

    const usagePercentage = (((diskInfo.total - diskInfo.free) / diskInfo.total) * 100).toFixed(2);

    const serverInfo = new ServerStorageResponseDto();
    serverInfo.diskAvailable = asHumanReadable(diskInfo.available);
    serverInfo.diskSize = asHumanReadable(diskInfo.total);
    serverInfo.diskUse = asHumanReadable(diskInfo.total - diskInfo.free);
    serverInfo.diskAvailableRaw = diskInfo.available;
    serverInfo.diskSizeRaw = diskInfo.total;
    serverInfo.diskUseRaw = diskInfo.total - diskInfo.free;
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
    const config = await this.getConfig({ withCache: false });
    const isInitialized = await this.userRepository.hasAdmin();
    const onboarding = await this.systemMetadataRepository.get(SystemMetadataKey.ADMIN_ONBOARDING);

    return {
      loginPageMessage: config.server.loginPageMessage,
      trashDays: config.trash.days,
      userDeleteDelay: config.user.deleteDelay,
      oauthButtonText: config.oauth.buttonText,
      isInitialized,
      isOnboarded: onboarding?.isOnboarded || false,
      externalDomain: config.server.externalDomain,
      mapDarkStyleUrl: config.map.darkStyle,
      mapLightStyleUrl: config.map.lightStyle,
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
      usage.quotaSizeInBytes = user.quotaSizeInBytes;

      serverStats.photos += usage.photos;
      serverStats.videos += usage.videos;
      serverStats.usage += usage.usage;
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
    await this.systemMetadataRepository.delete(SystemMetadataKey.LICENSE);
  }

  async getLicense(): Promise<LicenseResponseDto> {
    const license = await this.systemMetadataRepository.get(SystemMetadataKey.LICENSE);
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

    await this.systemMetadataRepository.set(SystemMetadataKey.LICENSE, licenseData);

    return licenseData;
  }
}
