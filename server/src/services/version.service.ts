import { Inject, Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';
import { isDev, serverVersion } from 'src/constants';
import { SystemConfigCore } from 'src/cores/system-config.core';
import { OnServerEvent } from 'src/decorators';
import { ReleaseNotification } from 'src/dtos/server-info.dto';
import { SystemMetadataKey, VersionCheckMetadata } from 'src/entities/system-metadata.entity';
import { ClientEvent, IEventRepository, ServerEvent, ServerEventMap } from 'src/interfaces/event.interface';
import { IJobRepository, JobName, JobStatus } from 'src/interfaces/job.interface';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { IServerInfoRepository } from 'src/interfaces/server-info.interface';
import { ISystemMetadataRepository } from 'src/interfaces/system-metadata.interface';
import { Version } from 'src/utils/version';

const asNotification = ({ releaseVersion, checkedAt }: VersionCheckMetadata): ReleaseNotification => {
  const version = Version.fromString(releaseVersion);
  return {
    isAvailable: version.isNewerThan(serverVersion) !== 0,
    checkedAt,
    serverVersion,
    releaseVersion: version,
  };
};

@Injectable()
export class VersionService {
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

  async init(): Promise<void> {
    await this.handleVersionCheck();
  }

  getVersion() {
    return serverVersion;
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

      const { newVersionCheck } = await this.configCore.getConfig();
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

      const githubRelease = await this.repository.getGitHubRelease();
      const githubVersion = Version.fromString(githubRelease.tag_name);
      const metadata: VersionCheckMetadata = {
        checkedAt: DateTime.utc().toISO(),
        releaseVersion: githubVersion.toString(),
      };

      await this.systemMetadataRepository.set(SystemMetadataKey.VERSION_CHECK_STATE, metadata);

      if (githubVersion.isNewerThan(serverVersion)) {
        const publishedAt = new Date(githubRelease.published_at);
        this.logger.log(`Found ${githubVersion.toString()}, released at ${publishedAt.toLocaleString()}`);
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
