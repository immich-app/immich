import { Injectable } from '@nestjs/common';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { SystemConfig } from 'src/config';
import { JOBS_ASSET_PAGINATION_SIZE, VIDEO_FRAME_EXTRACTION_VERSION } from 'src/constants';
import { StorageCore } from 'src/cores/storage.core';
import { OnEvent, OnJob } from 'src/decorators';
import { ImmichWorker, JobName, JobStatus, QueueName, VideoFrameExtractionStatus } from 'src/enum';
import { BaseService } from 'src/services/base.service';
import { JobItem, JobOf, VideoInterfaces } from 'src/types';
import { VideoFrameExtractionConfig } from 'src/utils/media';
import { parseByteRangePlaylist, parseIntervalChangeScores } from 'src/utils/video-frame';

type VideoFrameExtractionParameters = {
  targetResolution: number;
  qp: number;
  gridInterval: number;
};

@Injectable()
export class VideoFrameService extends BaseService {
  videoInterfaces: VideoInterfaces = { dri: [], mali: false };

  @OnEvent({ name: 'AppBootstrap', workers: [ImmichWorker.Microservices] })
  async onBootstrap() {
    this.videoInterfaces = await this.storageCore.getVideoInterfaces();
  }

  @OnJob({ name: JobName.VideoFrameExtractionQueueAll, queue: QueueName.VideoFrameExtraction })
  async handleQueueGenerateVideoFrames({ force }: JobOf<JobName.VideoFrameExtractionQueueAll>): Promise<JobStatus> {
    const { videoFrameExtraction } = await this.getConfig({ withCache: true });
    if (!videoFrameExtraction.enabled) {
      return JobStatus.Skipped;
    }

    const parametersHash = this.getParametersHash(videoFrameExtraction);

    let jobs: JobItem[] = [];
    const queueAll = async () => {
      await this.jobRepository.queueAll(jobs);
      jobs = [];
    };

    for await (const asset of this.assetJobRepository.streamForVideoFrameExtraction(force, parametersHash)) {
      jobs.push({ name: JobName.VideoFrameExtraction, data: { id: asset.id } });
      if (jobs.length >= JOBS_ASSET_PAGINATION_SIZE) {
        await queueAll();
      }
    }

    await queueAll();

    return JobStatus.Success;
  }

  @OnJob({ name: JobName.VideoFrameExtraction, queue: QueueName.VideoFrameExtraction })
  async handleGenerateVideoFrames({ id }: JobOf<JobName.VideoFrameExtraction>): Promise<JobStatus> {
    const { videoFrameExtraction, ffmpeg } = await this.getConfig({ withCache: true });
    if (!videoFrameExtraction.enabled) {
      return JobStatus.Skipped;
    }

    const asset = await this.assetJobRepository.getForVideoFrameExtraction(id);
    if (!asset) {
      return JobStatus.Failed;
    }

    const parameters: VideoFrameExtractionParameters = {
      targetResolution: videoFrameExtraction.targetResolution,
      qp: videoFrameExtraction.qp,
      gridInterval: videoFrameExtraction.gridInterval,
    };
    const parametersHash = this.getParametersHash(videoFrameExtraction);

    const existing = await this.videoFrameRepository.getExtractionRecord(id);
    if (existing?.status === VideoFrameExtractionStatus.Completed && existing.parametersHash === parametersHash) {
      return JobStatus.Skipped;
    }

    await this.videoFrameRepository.upsertExtractionRecord(id, {
      status: VideoFrameExtractionStatus.Processing,
      version: VIDEO_FRAME_EXTRACTION_VERSION,
      parameters,
      parametersHash,
    });

    const artifactPath = StorageCore.getVideoFrameArtifactPath(asset);
    this.storageCore.ensureFolders(artifactPath);

    const tempDir = await mkdtemp(join(tmpdir(), `immich-video-frames-${asset.id}-`));
    const playlistPath = join(tempDir, 'frames.m3u8');
    const scoresPath = join(tempDir, 'scores.txt');

    try {
      const config = VideoFrameExtractionConfig.create({
        inputPath: asset.originalPath,
        artifactPath,
        playlistPath,
        scoresPath,
        targetResolution: videoFrameExtraction.targetResolution,
        qp: videoFrameExtraction.qp,
        frameInterval: videoFrameExtraction.gridInterval,
        ffmpeg,
        videoInterfaces: this.videoInterfaces,
      });

      try {
        await new Promise<void>((resolve, reject) => {
          const proc = this.processRepository.spawn('ffmpeg', config.getExtractionCommand(asset.videoStream), {
            stdio: ['ignore', 'ignore', 'pipe'],
          });

          let stderr = '';
          proc.stderr!.setEncoding('utf8');
          proc.stderr!.on('data', (chunk: string) => (stderr += chunk));

          proc.on('error', reject);
          proc.on('close', (code) => {
            if (code !== 0) {
              return reject(new Error(`ffmpeg exited with code ${code}: ${stderr.trim()}`));
            }
            resolve();
          });
        });
      } catch (error) {
        this.logger.error(`Failed to generate video frames for asset ${asset.id}: ${error}`);
        return this.markFailed(id, parameters, parametersHash);
      }

      let playlist: string;
      let scores: string;
      try {
        [playlist, scores] = await Promise.all([readFile(playlistPath, 'utf8'), readFile(scoresPath, 'utf8')]);
      } catch (error) {
        this.logger.error(`Failed to read generated video frame artifacts for asset ${asset.id}: ${error}`);
        return this.markFailed(id, parameters, parametersHash);
      }

      const { initSegmentSize, frames: byteRanges } = parseByteRangePlaylist(playlist);
      const intervalChanges = parseIntervalChangeScores(scores);

      if (byteRanges.length === 0) {
        this.logger.warn(`No frames extracted for video ${asset.id}`);
        return this.markFailed(id, parameters, parametersHash);
      }

      const frames = byteRanges.map((range, frameIndex) => ({
        frameIndex,
        byteOffset: range.byteOffset,
        byteSize: range.byteSize,
        intervalChange: intervalChanges[frameIndex] ?? 0,
      }));

      await this.videoFrameRepository.upsertFrames(id, frames);
      await this.videoFrameRepository.upsertExtractionRecord(id, {
        status: VideoFrameExtractionStatus.Completed,
        version: VIDEO_FRAME_EXTRACTION_VERSION,
        parameters,
        parametersHash,
        path: artifactPath,
        initSegmentSize,
      });

      this.logger.log(`Extracted ${frames.length} frame(s) for video ${asset.id}`);

      return JobStatus.Success;
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  }

  private async markFailed(
    assetId: string,
    parameters: VideoFrameExtractionParameters,
    parametersHash: string,
  ): Promise<JobStatus> {
    await this.videoFrameRepository.upsertExtractionRecord(assetId, {
      status: VideoFrameExtractionStatus.Failed,
      version: VIDEO_FRAME_EXTRACTION_VERSION,
      parameters,
      parametersHash,
    });
    return JobStatus.Failed;
  }

  private getParametersHash(config: SystemConfig['videoFrameExtraction']): string {
    const { targetResolution, qp, gridInterval } = config;
    return this.cryptoRepository
      .hashSha256(JSON.stringify({ version: VIDEO_FRAME_EXTRACTION_VERSION, targetResolution, qp, gridInterval }))
      .toString('hex');
  }
}
