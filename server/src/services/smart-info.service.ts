import { Injectable } from '@nestjs/common';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { SystemConfig } from 'src/config';
import { JOBS_ASSET_PAGINATION_SIZE } from 'src/constants';
import { OnEvent, OnJob } from 'src/decorators';
import { CLIPConfig } from 'src/dtos/model-config.dto';
import { AssetType, AssetVisibility, DatabaseLock, ImmichWorker, JobName, JobStatus, QueueName } from 'src/enum';
import { ArgOf } from 'src/repositories/event.repository';
import { BaseService } from 'src/services/base.service';
import { JobItem, JobOf, VideoInfo } from 'src/types';
import { getCLIPModelInfo, isSmartSearchEnabled } from 'src/utils/misc';
import { elementWiseMean } from 'src/utils/vector';

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

    let embedding: string;
    if (asset.type === AssetType.Video) {
      const result = await this.encodeVideoClip(asset.originalPath, machineLearning.clip);
      if (!result) {
        return JobStatus.Failed;
      }
      embedding = result;
    } else {
      embedding = await this.machineLearningRepository.encodeImage(asset.files[0].path, machineLearning.clip);
    }

    if (this.databaseRepository.isBusy(DatabaseLock.CLIPDimSize)) {
      this.logger.verbose(`Waiting for CLIP dimension size to be updated`);
      await this.databaseRepository.wait(DatabaseLock.CLIPDimSize);
    }

    const newConfig = await this.getConfig({ withCache: true });
    if (machineLearning.clip.modelName !== newConfig.machineLearning.clip.modelName) {
      // Skip the job if the model has changed since the embedding was generated.
      return JobStatus.Skipped;
    }

    await this.searchRepository.upsert(asset.id, embedding);

    return JobStatus.Success;
  }

  private async encodeVideoClip(originalPath: string, clipConfig: CLIPConfig): Promise<string | null> {
    let videoInfo: VideoInfo;
    try {
      videoInfo = await this.mediaRepository.probe(originalPath);
    } catch (error) {
      this.logger.error(`Failed to probe video: ${originalPath}`, error);
      return null;
    }

    const duration = videoInfo.format.duration;
    let timestamps: number[];
    if (!duration || duration <= 0 || !Number.isFinite(duration)) {
      timestamps = [0];
    } else if (duration < 2) {
      timestamps = [duration / 2];
    } else {
      const count = 8;
      timestamps = Array.from({ length: count }, (_, i) => duration * (0.05 + (0.9 * i) / (count - 1)));
    }

    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'immich-video-clip-'));
    try {
      let framePaths: string[];
      try {
        framePaths = await this.mediaRepository.extractVideoFrames(originalPath, timestamps, tempDir);
      } catch (error) {
        this.logger.error(`Failed to extract video frames: ${originalPath}`, error);
        return null;
      }

      let embeddings: number[][];
      try {
        embeddings = [];
        for (const framePath of framePaths) {
          const raw = await this.machineLearningRepository.encodeImage(framePath, clipConfig);
          embeddings.push(JSON.parse(raw));
        }
      } catch (error) {
        this.logger.error(`Failed to encode video frames: ${originalPath}`, error);
        return null;
      }

      const averaged = elementWiseMean(embeddings);
      return JSON.stringify(averaged);
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  }
}
