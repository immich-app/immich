import { Injectable } from '@nestjs/common';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { SystemConfig } from 'src/config';
import { JOBS_ASSET_PAGINATION_SIZE } from 'src/constants';
import { OnEvent, OnJob } from 'src/decorators';
import { AssetType, AssetVisibility, DatabaseLock, ImmichWorker, JobName, JobStatus, QueueName } from 'src/enum';
import { ArgOf } from 'src/repositories/event.repository';
import { BaseService } from 'src/services/base.service';
import { JobItem, JobOf } from 'src/types';
import { getCLIPModelInfo, isSmartSearchEnabled } from 'src/utils/misc';

@Injectable()
export class SmartInfoService extends BaseService {
  @OnEvent({ name: 'ConfigInit', workers: [ImmichWorker.Microservices] })
  async onConfigInit({ newConfig }: ArgOf<'ConfigInit'>) {
    await this.init(newConfig);
  }

  @OnEvent({ name: 'ConfigUpdate', workers: [ImmichWorker.Microservices], server: true })
  async onConfigUpdate({ oldConfig, newConfig }: ArgOf<'ConfigUpdate'>) {
    await this.init(newConfig, oldConfig);
  }

  @OnEvent({ name: 'ConfigValidate' })
  onConfigValidate({ newConfig }: ArgOf<'ConfigValidate'>) {
    try {
      getCLIPModelInfo(newConfig.machineLearning.clip.modelName);
    } catch {
      throw new Error(
        `Unknown CLIP model: ${newConfig.machineLearning.clip.modelName}. Please check the model name for typos and confirm this is a supported model.`,
      );
    }
  }

  private async init(newConfig: SystemConfig, oldConfig?: SystemConfig) {
    if (!isSmartSearchEnabled(newConfig.machineLearning)) {
      return;
    }

    await this.databaseRepository.withLock(DatabaseLock.CLIPDimSize, async () => {
      const { dimSize } = getCLIPModelInfo(newConfig.machineLearning.clip.modelName);
      const dbDimSize = await this.databaseRepository.getDimensionSize('smart_search');
      this.logger.verbose(`Current database CLIP dimension size is ${dbDimSize}`);

      const modelChange =
        oldConfig && oldConfig.machineLearning.clip.modelName !== newConfig.machineLearning.clip.modelName;
      const dimSizeChange = dbDimSize !== dimSize;
      if (!modelChange && !dimSizeChange) {
        return;
      }

      if (dimSizeChange) {
        this.logger.log(
          `Dimension size of model ${newConfig.machineLearning.clip.modelName} is ${dimSize}, but database expects ${dbDimSize}.`,
        );
        this.logger.log(`Updating database CLIP dimension size to ${dimSize}.`);
        await this.databaseRepository.setDimensionSize(dimSize);
        this.logger.log(`Successfully updated database CLIP dimension size from ${dbDimSize} to ${dimSize}.`);
      } else {
        await this.databaseRepository.deleteAllSearchEmbeddings();
      }

      // TODO: A job to reindex all assets should be scheduled, though user
      // confirmation should probably be requested before doing that.
    });
  }

  @OnJob({ name: JobName.SmartSearchQueueAll, queue: QueueName.SmartSearch })
  async handleQueueEncodeClip({ force }: JobOf<JobName.SmartSearchQueueAll>): Promise<JobStatus> {
    const { machineLearning } = await this.getConfig({ withCache: false });
    if (!isSmartSearchEnabled(machineLearning)) {
      return JobStatus.Skipped;
    }

    if (force) {
      const { dimSize } = getCLIPModelInfo(machineLearning.clip.modelName);
      // in addition to deleting embeddings, update the dimension size in case it failed earlier
      await this.databaseRepository.setDimensionSize(dimSize);
    }

    let queue: JobItem[] = [];
    const assets = this.assetJobRepository.streamForEncodeClip(force);
    for await (const asset of assets) {
      queue.push({ name: JobName.SmartSearch, data: { id: asset.id } });
      if (queue.length >= JOBS_ASSET_PAGINATION_SIZE) {
        await this.jobRepository.queueAll(queue);
        queue = [];
      }
    }

    await this.jobRepository.queueAll(queue);

    return JobStatus.Success;
  }

  @OnJob({ name: JobName.SmartSearch, queue: QueueName.SmartSearch })
  async handleEncodeClip({ id }: JobOf<JobName.SmartSearch>): Promise<JobStatus> {
    const { machineLearning } = await this.getConfig({ withCache: true });
    if (!isSmartSearchEnabled(machineLearning)) {
      return JobStatus.Skipped;
    }

    const asset = await this.assetJobRepository.getForClipEncoding(id);
    if (!asset || asset.files.length !== 1) {
      return JobStatus.Failed;
    }

    if (asset.visibility === AssetVisibility.Hidden) {
      return JobStatus.Skipped;
    }

    if (asset.type === AssetType.Video && asset.duration && asset.duration > 0) {
      return this.encodeVideoClip(asset, machineLearning);
    }

    const embedding = await this.machineLearningRepository.encodeImage(asset.files[0].path, machineLearning.clip);

    if (this.databaseRepository.isBusy(DatabaseLock.CLIPDimSize)) {
      this.logger.verbose(`Waiting for CLIP dimension size to be updated`);
      await this.databaseRepository.wait(DatabaseLock.CLIPDimSize);
    }

    const newConfig = await this.getConfig({ withCache: true });
    if (machineLearning.clip.modelName !== newConfig.machineLearning.clip.modelName) {
      return JobStatus.Skipped;
    }

    await this.searchRepository.upsert(asset.id, embedding);

    return JobStatus.Success;
  }

  private async encodeVideoClip(
    asset: NonNullable<Awaited<ReturnType<typeof this.assetJobRepository.getForClipEncoding>>>,
    machineLearning: SystemConfig['machineLearning'],
  ): Promise<JobStatus> {
    const { clip } = machineLearning;
    const duration = asset.duration!;
    const maxFrames = clip.videoMaxFrames;

    let timestamps: number[];

    if (clip.videoFrameStrategy === 'scene') {
      timestamps = await this.mediaRepository.detectSceneChanges(
        asset.originalPath,
        clip.videoSceneThreshold,
        maxFrames,
      );
    } else {
      const interval = clip.videoFrameInterval * 1000;
      timestamps = [];
      for (let t = 0; t < duration && timestamps.length < maxFrames; t += interval) {
        timestamps.push(t);
      }
      if (timestamps.length === 0) {
        timestamps.push(0);
      }
    }

    if (timestamps.length === 0) {
      this.logger.warn(`No frames extracted for video ${asset.id}`);
      return JobStatus.Failed;
    }

    const tempDir = await mkdtemp(join(tmpdir(), `immich-video-frames-${asset.id}-`));

    try {
      const framePaths = await this.mediaRepository.extractVideoFrames(asset.originalPath, timestamps, tempDir);

      const frames: { frameIndex: number; timestamp: number; embedding: string }[] = [];

      for (let i = 0; i < framePaths.length; i++) {
        const embedding = await this.machineLearningRepository.encodeImage(framePaths[i], clip);
        frames.push({ frameIndex: i, timestamp: timestamps[i], embedding });
      }

      if (this.databaseRepository.isBusy(DatabaseLock.CLIPDimSize)) {
        this.logger.verbose(`Waiting for CLIP dimension size to be updated`);
        await this.databaseRepository.wait(DatabaseLock.CLIPDimSize);
      }

      const newConfig = await this.getConfig({ withCache: true });
      if (machineLearning.clip.modelName !== newConfig.machineLearning.clip.modelName) {
        return JobStatus.Skipped;
      }

      await this.searchRepository.upsertVideoFrames(asset.id, frames);

      return JobStatus.Success;
    } finally {
      await rm(tempDir, { recursive: true, force: true }).catch(() => {});
    }
  }
}
