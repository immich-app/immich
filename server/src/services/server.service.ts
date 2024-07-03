import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { getBuildMetadata, getServerLicensePublicKey } from 'src/config';
import { serverVersion } from 'src/constants';
import { StorageCore, StorageFolder } from 'src/cores/storage.core';
import { SystemConfigCore } from 'src/cores/system-config.core';
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
import { SystemMetadataKey } from 'src/entities/system-metadata.entity';
import { ICryptoRepository } from 'src/interfaces/crypto.interface';
import { OnEvents } from 'src/interfaces/event.interface';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { IServerInfoRepository } from 'src/interfaces/server-info.interface';
import { IStorageRepository } from 'src/interfaces/storage.interface';
import { ISystemMetadataRepository } from 'src/interfaces/system-metadata.interface';
import { IUserRepository, UserStatsQueryResponse } from 'src/interfaces/user.interface';
import { asHumanReadable } from 'src/utils/bytes';
import { mimeTypes } from 'src/utils/mime-types';
import { isDuplicateDetectionEnabled, isFacialRecognitionEnabled, isSmartSearchEnabled } from 'src/utils/misc';

@Injectable()
export class ServerService implements OnEvents {
  private configCore: SystemConfigCore;

  constructor(
    @Inject(IUserRepository) private userRepository: IUserRepository,
    @Inject(IStorageRepository) private storageRepository: IStorageRepository,
    @Inject(ISystemMetadataRepository) private systemMetadataRepository: ISystemMetadataRepository,
    @Inject(IServerInfoRepository) private serverInfoRepository: IServerInfoRepository,
    @Inject(ILoggerRepository) private logger: ILoggerRepository,
    @Inject(ICryptoRepository) private cryptoRepository: ICryptoRepository,
  ) {
    this.logger.setContext(ServerService.name);
    this.configCore = SystemConfigCore.create(systemMetadataRepository, this.logger);
  }

  async onBootstrapEvent(): Promise<void> {
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
    const buildMetadata = getBuildMetadata();
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
    const { reverseGeocoding, map, machineLearning, trash, oauth, passwordLogin, notifications } =
      await this.configCore.getConfig({ withCache: false });

    return {
      smartSearch: isSmartSearchEnabled(machineLearning),
      facialRecognition: isFacialRecognitionEnabled(machineLearning),
      duplicateDetection: isDuplicateDetectionEnabled(machineLearning),
      map: map.enabled,
      reverseGeocoding: reverseGeocoding.enabled,
      sidecar: true,
      search: true,
      trash: trash.enabled,
      oauth: oauth.enabled,
      oauthAutoLaunch: oauth.autoLaunch,
      passwordLogin: passwordLogin.enabled,
      configFile: this.configCore.isUsingConfigFile(),
      email: notifications.smtp.enabled,
    };
  }

  async getTheme() {
    const { theme } = await this.configCore.getConfig({ withCache: false });
    return theme;
  }

  async getConfig(): Promise<ServerConfigDto> {
    const config = await this.configCore.getConfig({ withCache: false });
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

  async getLicense(): Promise<LicenseKeyDto | null> {
    return this.systemMetadataRepository.get(SystemMetadataKey.LICENSE);
  }

  async setLicense(dto: LicenseKeyDto): Promise<LicenseResponseDto> {
    if (!dto.licenseKey.startsWith('IMSV-')) {
      throw new BadRequestException('Invalid license key');
    }
    const licenseValid = this.cryptoRepository.verifySha256(
      dto.licenseKey,
      dto.activationKey,
      getServerLicensePublicKey(),
    );

    if (!licenseValid) {
      throw new BadRequestException('Invalid license key');
    }

    const licenseData = {
      ...dto,
      activatedAt: new Date(),
    };

    await this.systemMetadataRepository.set(SystemMetadataKey.LICENSE, licenseData);

    return licenseData;
  }
}
