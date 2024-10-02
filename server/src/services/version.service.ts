import { Inject, Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';
import semver, { SemVer } from 'semver';
import { serverVersion } from 'src/constants';
import { OnEvent } from 'src/decorators';
import { ReleaseNotification, ServerVersionResponseDto } from 'src/dtos/server.dto';
import { VersionCheckMetadata } from 'src/entities/system-metadata.entity';
import { ImmichEnvironment, SystemMetadataKey } from 'src/enum';
import { IConfigRepository } from 'src/interfaces/config.interface';
import { DatabaseLock, IDatabaseRepository } from 'src/interfaces/database.interface';
import { ArgOf, IEventRepository } from 'src/interfaces/event.interface';
import { IJobRepository, JobName, JobStatus } from 'src/interfaces/job.interface';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { IServerInfoRepository } from 'src/interfaces/server-info.interface';
import { ISystemMetadataRepository } from 'src/interfaces/system-metadata.interface';
import { IVersionHistoryRepository } from 'src/interfaces/version-history.interface';
import { BaseService } from 'src/services/base.service';

const asNotification = ({ checkedAt, releaseVersion }: VersionCheckMetadata): ReleaseNotification => {
  return {
    isAvailable: semver.gt(releaseVersion, serverVersion),
    checkedAt,
    serverVersion: ServerVersionResponseDto.fromSemVer(serverVersion),
    releaseVersion: ServerVersionResponseDto.fromSemVer(new SemVer(releaseVersion)),
  };
};

@Injectable()
export class VersionService extends BaseService {
  constructor(
    @Inject(IConfigRepository) configRepository: IConfigRepository,
    @Inject(IDatabaseRepository) private databaseRepository: IDatabaseRepository,
    @Inject(IEventRepository) private eventRepository: IEventRepository,
    @Inject(IJobRepository) private jobRepository: IJobRepository,
    @Inject(IServerInfoRepository) private repository: IServerInfoRepository,
    @Inject(ISystemMetadataRepository) systemMetadataRepository: ISystemMetadataRepository,
    @Inject(IVersionHistoryRepository) private versionRepository: IVersionHistoryRepository,
    @Inject(ILoggerRepository) logger: ILoggerRepository,
  ) {
    super(configRepository, systemMetadataRepository, logger);
    this.logger.setContext(VersionService.name);
  }

  @OnEvent({ name: 'app.bootstrap' })
  async onBootstrap(): Promise<void> {
    await this.handleVersionCheck();

    await this.databaseRepository.withLock(DatabaseLock.VersionHistory, async () => {
      const latest = await this.versionRepository.getLatest();
      const current = serverVersion.toString();
      if (!latest || latest.version !== current) {
        this.logger.log(`Version has changed, adding ${current} to history`);
        await this.versionRepository.create({ version: current });
      }
    });
  }

  getVersion() {
    return ServerVersionResponseDto.fromSemVer(serverVersion);
  }

  getVersionHistory() {
    return this.versionRepository.getAll();
  }

  async handleQueueVersionCheck() {
    await this.jobRepository.queue({ name: JobName.VERSION_CHECK, data: {} });
  }

  async handleVersionCheck(): Promise<JobStatus> {
    try {
      this.logger.debug('Running version check');

      const { environment } = this.configRepository.getEnv();
      if (environment === ImmichEnvironment.DEVELOPMENT) {
        return JobStatus.SKIPPED;
      }

      const { newVersionCheck } = await this.getConfig({ withCache: true });
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
        this.eventRepository.clientBroadcast('on_new_release', asNotification(metadata));
      }
    } catch (error: Error | any) {
      this.logger.warn(`Unable to run version check: ${error}`, error?.stack);
      return JobStatus.FAILED;
    }

    return JobStatus.SUCCESS;
  }

  @OnEvent({ name: 'websocket.connect' })
  async onWebsocketConnection({ userId }: ArgOf<'websocket.connect'>) {
    this.eventRepository.clientSend('on_server_version', userId, serverVersion);
    const metadata = await this.systemMetadataRepository.get(SystemMetadataKey.VERSION_CHECK_STATE);
    if (metadata) {
      this.eventRepository.clientSend('on_new_release', userId, asNotification(metadata));
    }
  }
}
