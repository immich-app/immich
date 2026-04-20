import { Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';
import semver, { SemVer } from 'semver';
import { serverVersion } from 'src/constants';
import { OnEvent, OnJob } from 'src/decorators';
import { ReleaseNotification, ServerVersionResponseDto } from 'src/dtos/server.dto';
import { CronJob, DatabaseLock, ImmichWorker, JobName, JobStatus, QueueName, SystemMetadataKey } from 'src/enum';
import { ArgOf } from 'src/repositories/event.repository';
import { BaseService } from 'src/services/base.service';
import { VersionCheckMetadata } from 'src/types';
import { handlePromiseError } from 'src/utils/misc';

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
  @OnEvent({ name: 'AppBootstrap', workers: [ImmichWorker.Microservices] })
  async onBootstrap(): Promise<void> {
    const hasLock = await this.databaseRepository.tryLock(DatabaseLock.VersionCheck);
    if (hasLock) {
      await this.handleVersionCheck();

      const randomMinute = Math.floor(Math.random() * 60);
      const expression = `${randomMinute} * * * *`;
      this.logger.debug(`Scheduling version check for cron ${expression}`);
      this.cronRepository.create({
        name: CronJob.VersionCheck,
        expression,
        onTick: () => handlePromiseError(this.handleQueueVersionCheck(), this.logger),
      });
    }

    await this.databaseRepository.withLock(DatabaseLock.VersionHistory, async () => {
      const previous = await this.versionRepository.getLatest();
      const current = serverVersion.toString();

      if (!previous) {
        await this.versionRepository.create({ version: current });
        return;
      }

      if (previous.version !== current) {
        const previousVersion = new SemVer(previous.version);

        this.logger.log(`Adding ${current} to upgrade history`);
        await this.versionRepository.create({ version: current });

        const needsNewMemories = semver.lt(previousVersion, '1.129.0');
        if (needsNewMemories) {
          await this.jobRepository.queue({ name: JobName.MemoryGenerate });
        }
      }
    });
  }

  getVersion() {
    return ServerVersionResponseDto.fromSemVer(serverVersion);
  }

  getVersionHistory() {
    return this.versionRepository.getAll();
  }

  @OnEvent({ name: 'ConfigUpdate' })
  async onConfigUpdate({ oldConfig, newConfig }: ArgOf<'ConfigUpdate'>) {
    if (!oldConfig.newVersionCheck.enabled && newConfig.newVersionCheck.enabled) {
      await this.handleQueueVersionCheck();
    }
  }

  async handleQueueVersionCheck() {
    await this.jobRepository.queue({ name: JobName.VersionCheck, data: {} });
  }

  @OnJob({ name: JobName.VersionCheck, queue: QueueName.BackgroundTask })
  async handleVersionCheck(): Promise<JobStatus> {
    try {
      this.logger.debug('Running version check');

      const { newVersionCheck } = await this.getConfig({ withCache: true });
      if (!newVersionCheck.enabled) {
        return JobStatus.Skipped;
      }

      const versionCheck = await this.systemMetadataRepository.get(SystemMetadataKey.VersionCheckState);
      if (versionCheck?.checkedAt) {
        const lastUpdate = DateTime.fromISO(versionCheck.checkedAt);
        const elapsedTime = DateTime.now().diff(lastUpdate).as('seconds');
        if (elapsedTime < 50) {
          return JobStatus.Skipped;
        }
      }

      const { version: releaseVersion, published_at: publishedAt } = await this.serverInfoRepository.getLatestRelease();
      const metadata: VersionCheckMetadata = { checkedAt: DateTime.utc().toISO(), releaseVersion };

      await this.systemMetadataRepository.set(SystemMetadataKey.VersionCheckState, metadata);

      if (semver.gt(releaseVersion, serverVersion)) {
        this.logger.log(`Found ${releaseVersion}, released at ${new Date(publishedAt).toLocaleString()}`);
        this.websocketRepository.clientBroadcast('on_new_release', asNotification(metadata));
      }
    } catch (error: Error | any) {
      this.logger.warn(`Unable to run version check: ${error}\n${error?.stack}`);
      return JobStatus.Failed;
    }

    return JobStatus.Success;
  }

  @OnEvent({ name: 'WebsocketConnect' })
  async onWebsocketConnection({ userId }: ArgOf<'WebsocketConnect'>) {
    this.websocketRepository.clientSend('on_server_version', userId, serverVersion);

    const { newVersionCheck } = await this.getConfig({ withCache: true });
    if (!newVersionCheck.enabled) {
      return;
    }

    const metadata = await this.systemMetadataRepository.get(SystemMetadataKey.VersionCheckState);
    if (metadata) {
      this.websocketRepository.clientSend('on_new_release', userId, asNotification(metadata));
    }
  }
}
