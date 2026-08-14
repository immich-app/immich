import { Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';
import semver, { SemVer } from 'semver';
import { serverVersion } from 'src/constants';
import { OnEvent, OnJob } from 'src/decorators';
import { ReleaseEventV1, ReleaseType, ServerVersionResponseDto } from 'src/dtos/server.dto';
import { ReleaseChannel } from 'src/dtos/system-config.dto';
import { CronJob, DatabaseLock, ImmichWorker, JobName, JobStatus, QueueName, SystemMetadataKey } from 'src/enum';
import { ArgOf } from 'src/repositories/event.repository';
import { BaseService } from 'src/services/base.service';
import { VersionCheckMetadata } from 'src/types';
import { handlePromiseError } from 'src/utils/misc';

const asNotification = (
  channel: ReleaseChannel,
  { checkedAt, releaseVersion }: VersionCheckMetadata,
): ReleaseEventV1 => {
  return {
    // can't use gt because it's broken for release candidates F https://github.com/npm/node-semver/issues/483
    isAvailable: semver.intersects(`>${serverVersion}`, releaseVersion, {
      includePrerelease: channel === ReleaseChannel.ReleaseCandidate,
    }),
    checkedAt,
    serverVersion: ServerVersionResponseDto.fromSemVer(serverVersion),
    releaseVersion: ServerVersionResponseDto.fromSemVer(new SemVer(releaseVersion)),
    type: semver.diff(serverVersion, releaseVersion) as ReleaseType,
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

        const isNeedsNewMemories = semver.lt(previousVersion, '1.129.0');
        if (isNeedsNewMemories) {
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

      const { version: releaseVersion, published_at: publishedAt } = await this.serverInfoRepository.getLatestRelease(
        newVersionCheck.channel,
      );
      const metadata: VersionCheckMetadata = { checkedAt: DateTime.utc().toISO(), releaseVersion };

      await this.systemMetadataRepository.set(SystemMetadataKey.VersionCheckState, metadata);

      // can't use gt because it's broken for release candidates F https://github.com/npm/node-semver/issues/483
      if (
        semver.intersects(`>${serverVersion}`, releaseVersion, {
          includePrerelease: newVersionCheck.channel === ReleaseChannel.ReleaseCandidate,
        })
      ) {
        this.logger.log(`Found ${releaseVersion}, released at ${new Date(publishedAt).toLocaleString()}`);
        this.websocketRepository.clientBroadcast('on_new_release', asNotification(newVersionCheck.channel, metadata));
      }
    } catch (error: Error | any) {
      this.logger.warn(`Unable to run version check: ${error}\n${error?.stack}`);
      return JobStatus.Failed;
    }

    return JobStatus.Success;
  }

  @OnEvent({ name: 'WebsocketConnect' })
  async onWebsocketConnection({ userId }: ArgOf<'WebsocketConnect'>) {
    this.websocketRepository.clientSend(
      'on_server_version',
      userId,
      ServerVersionResponseDto.fromSemVer(serverVersion),
    );

    const { newVersionCheck } = await this.getConfig({ withCache: true });
    if (!newVersionCheck.enabled) {
      return;
    }

    const metadata = await this.systemMetadataRepository.get(SystemMetadataKey.VersionCheckState);
    if (metadata) {
      this.websocketRepository.clientSend('on_new_release', userId, asNotification(newVersionCheck.channel, metadata));
    }
  }
}
