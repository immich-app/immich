import { Inject, Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';
import semver, { SemVer } from 'semver';
import { isDev, serverVersion } from 'src/constants';
import { SystemConfigCore } from 'src/cores/system-config.core';
import { OnServerEvent } from 'src/decorators';
import { ReleaseNotification, ServerVersionResponseDto } from 'src/dtos/server.dto';
import { SystemMetadataKey, VersionCheckMetadata } from 'src/entities/system-metadata.entity';
import { ClientEvent, IEventRepository, OnEvents, ServerEvent, ServerEventMap } from 'src/interfaces/event.interface';
import { IJobRepository, JobName, JobStatus } from 'src/interfaces/job.interface';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { IServerInfoRepository } from 'src/interfaces/server-info.interface';
import { ISystemMetadataRepository } from 'src/interfaces/system-metadata.interface';

const asNotification = ({ checkedAt, releaseVersion }: VersionCheckMetadata): ReleaseNotification => {
  return {
    isAvailable: semver.gt(releaseVersion, serverVersion),
    checkedAt,
    serverVersion: ServerVersionResponseDto.fromSemVer(serverVersion),
    releaseVersion: ServerVersionResponseDto.fromSemVer(new SemVer(releaseVersion)),
  };
};

@Injectable()
export class VersionService implements OnEvents {
  private configCore: SystemConfigCore;

  constructor(
    @Inject(IEventRepository) private eventRepository: IEventRepository,
    @Inject(IJobRepository) private jobRepository: IJobRepository,
    @Inject(IServerInfoRepository) private repository: IServerInfoRepository,
    @Inject(ISystemMetadataRepository) private systemMetadataRepository: ISystemMetadataRepository,
    @Inject(ILoggerRepository) private logger: ILoggerRepository,
  ) {
    this.logger.setContext(VersionService.name);
    this.configCore = SystemConfigCore.create(systemMetadataRepository, this.logger);
  }

  async onBootstrapEvent(): Promise<void> {
    await this.handleVersionCheck();
  }

  getVersion() {
    return ServerVersionResponseDto.fromSemVer(serverVersion);
  }

  async handleQueueVersionCheck() {
    await this.jobRepository.queue({ name: JobName.VERSION_CHECK, data: {} });
  }

  async handleVersionCheck(): Promise<JobStatus> {
    try {
      this.logger.debug('Running version check');

      if (isDev()) {
        return JobStatus.SKIPPED;
      }

      const { newVersionCheck } = await this.configCore.getConfig({ withCache: true });
      if (!newVersionCheck.enabled) {
        return JobStatus.SKIPPED;
      }

      const versionCheck = await this.systemMetadataRepository.get(SystemMetadataKey.VERSION_CHECK_STATE);
      if (versionCheck?.checkedAt) {
        const lastUpdate = DateTime.fromISO(versionCheck.checkedAt);
        const elapsedTime = DateTime.now().diff(lastUpdate).as('minutes');
        // check once per hour (max)
        if (elapsedTime < 60) {
          return JobStatus.SKIPPED;
        }
      }

      const { tag_name: releaseVersion, published_at: publishedAt } = await this.repository.getGitHubRelease();
      const metadata: VersionCheckMetadata = { checkedAt: DateTime.utc().toISO(), releaseVersion };

      await this.systemMetadataRepository.set(SystemMetadataKey.VERSION_CHECK_STATE, metadata);

      if (semver.gt(releaseVersion, serverVersion)) {
        this.logger.log(`Found ${releaseVersion}, released at ${new Date(publishedAt).toLocaleString()}`);
        this.eventRepository.clientBroadcast(ClientEvent.NEW_RELEASE, asNotification(metadata));
      }
    } catch (error: Error | any) {
      this.logger.warn(`Unable to run version check: ${error}`, error?.stack);
      return JobStatus.FAILED;
    }

    return JobStatus.SUCCESS;
  }

  @OnServerEvent(ServerEvent.WEBSOCKET_CONNECT)
  async onWebsocketConnection({ userId }: ServerEventMap[ServerEvent.WEBSOCKET_CONNECT]) {
    this.eventRepository.clientSend(ClientEvent.SERVER_VERSION, userId, serverVersion);
    const metadata = await this.systemMetadataRepository.get(SystemMetadataKey.VERSION_CHECK_STATE);
    if (metadata) {
      this.eventRepository.clientSend(ClientEvent.NEW_RELEASE, userId, asNotification(metadata));
    }
  }
}
