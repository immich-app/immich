import { Injectable } from '@nestjs/common';
import { ChildProcess } from 'node:child_process';
import { join } from 'node:path';
import {
  HLS_BACKPRESSURE_PAUSE_SEGMENTS,
  HLS_BACKPRESSURE_RESUME_SEGMENTS,
  HLS_CLEANUP_INTERVAL_MS,
  HLS_CRF,
  HLS_INACTIVITY_TIMEOUT_MS,
  HLS_LEASE_DURATION_MS,
  HLS_SEGMENT_DURATION,
  HLS_SEGMENT_FILENAME_REGEX,
  HLS_VARIANTS,
} from 'src/constants';
import { StorageCore } from 'src/cores/storage.core';
import { OnEvent, OnJob } from 'src/decorators';
import { DatabaseLock, ImmichWorker, JobName, QueueName, TranscodeTarget } from 'src/enum';
import { ArgOf } from 'src/repositories/event.repository';
import { BaseService } from 'src/services/base.service';
import { VideoInterfaces } from 'src/types';
import { isVideoStreamSessionPkConstraint } from 'src/utils/database';
import { BaseConfig } from 'src/utils/media';

type Session = {
  assetId: string;
  expiresAt: Date;
  id: string;
  lastActivityTime: Date;
  lastClientRequestedSegment: number | null;
  lastCompletedSegment: number | null;
  ownerId: string;
  paused: boolean;
  process: ChildProcess | null;
  starting: boolean;
  startSegment: number | null;
  variantIndex: number | null;
};

@Injectable()
export class TranscodingService extends BaseService {
  private sessions = new Map<string, Session>();
  private videoInterfaces: VideoInterfaces = { dri: [], mali: false };
  private cleanupInterval: NodeJS.Timeout | null = null;

  @OnEvent({ name: 'AppBootstrap', workers: [ImmichWorker.Microservices] })
  async onBootstrap() {
    const [videoInterfaces] = await Promise.all([this.storageCore.getVideoInterfaces(), this.removeExpiredSessions()]);
    this.videoInterfaces = videoInterfaces;
  }

  @OnEvent({ name: 'AppShutdown', workers: [ImmichWorker.Microservices] })
  onShutdown() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    return Promise.all(this.sessions.values().map(({ id }) => this.onSessionEnd({ sessionId: id })));
  }

  @OnJob({ name: JobName.HlsSessionCleanup, queue: QueueName.BackgroundTask })
  onHlsSessionCleanup() {
    return this.removeExpiredSessions();
  }

  @OnEvent({ name: 'HlsSessionRequest', server: true, workers: [ImmichWorker.Microservices] })
  async onSessionRequest({ assetId, sessionId, ownerId }: ArgOf<'HlsSessionRequest'>) {
    try {
      const expiresAt = new Date(Date.now() + HLS_LEASE_DURATION_MS);
      await this.videoStreamRepository.createSession({ id: sessionId, assetId, expiresAt });
      this.sessions.set(sessionId, {
        assetId,
        expiresAt,
        id: sessionId,
        lastActivityTime: new Date(),
        lastClientRequestedSegment: null,
        lastCompletedSegment: null,
        ownerId,
        paused: false,
        process: null,
        starting: false,
        startSegment: null,
        variantIndex: null,
      });
      this.cleanupInterval ??= setInterval(() => void this.removeInactiveSessions(), HLS_CLEANUP_INTERVAL_MS);
      this.websocketRepository.serverSend('HlsSessionResult', { sessionId });
    } catch (error) {
      // If insertion failed due to a PK constraint, another worker has already created a session for this ID.
      if (!isVideoStreamSessionPkConstraint(error)) {
        this.logger.error(`Failed to create HLS session ${sessionId}: ${error}`);
        this.websocketRepository.serverSend('HlsSessionResult', { sessionId, error: 'Failed to create HLS session' });
      }
    }
  }

  @OnEvent({ name: 'HlsSessionEnd', server: true, workers: [ImmichWorker.Microservices] })
  async onSessionEnd({ sessionId }: ArgOf<'HlsSessionEnd'>) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return;
    }
    this.sessions.delete(sessionId);
    if (this.cleanupInterval && this.sessions.size === 0) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.stopTranscode(session);
    await this.removeSessionDir(session);
    await this.videoStreamRepository.deleteSession(sessionId);
  }

  @OnEvent({ name: 'HlsHeartbeat', server: true, workers: [ImmichWorker.Microservices] })
  async onHeartbeat({ sessionId, segmentIndex }: ArgOf<'HlsHeartbeat'>) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return;
    }

    session.lastActivityTime = new Date();

    if (segmentIndex !== undefined) {
      session.lastClientRequestedSegment = segmentIndex;
      this.applyBackpressure(session);
    }

    const remaining = session.expiresAt.getTime() - Date.now();
    if (remaining < HLS_LEASE_DURATION_MS / 2) {
      session.expiresAt = new Date(Date.now() + HLS_LEASE_DURATION_MS);
      await this.videoStreamRepository.extendSession(sessionId, session.expiresAt);
    }
  }

  @OnEvent({ name: 'HlsSegmentRequest', server: true, workers: [ImmichWorker.Microservices] })
  async onSegmentRequest({ sessionId, variantIndex, segmentIndex }: ArgOf<'HlsSegmentRequest'>) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return;
    }

    session.variantIndex ??= variantIndex;
    session.startSegment ??= segmentIndex;
    const curSegment = session.lastCompletedSegment === null ? session.startSegment : session.lastCompletedSegment + 1;
    const isNeedsRestart =
      session.variantIndex !== variantIndex || segmentIndex < session.startSegment || segmentIndex > curSegment + 1;
    if (isNeedsRestart) {
      this.stopTranscode(session);
      session.variantIndex = variantIndex;
      session.startSegment = segmentIndex;
    } else if (session.process) {
      this.resumeTranscode(session);
      return;
    } else if (session.starting) {
      this.logger.debug(`Session ${sessionId} is already starting a transcode, skipping duplicate start request`);
      return;
    }

    session.starting = true;
    try {
      const process = await this.startTranscode(session, variantIndex, segmentIndex);
      if (process) {
        session.process = process;
      }
    } finally {
      session.starting = false;
    }
  }

  private applyBackpressure(session: Session) {
    if (session.lastCompletedSegment === null || session.lastClientRequestedSegment === null) {
      return;
    }
    const lead = session.lastCompletedSegment - session.lastClientRequestedSegment;
    this.logger.debug(`Session ${session.id} lead is ${lead} segments`);
    if (!session.paused && lead > HLS_BACKPRESSURE_PAUSE_SEGMENTS) {
      this.pauseTranscode(session);
    } else if (session.paused && lead < HLS_BACKPRESSURE_RESUME_SEGMENTS) {
      this.resumeTranscode(session);
    }
  }

  private async startTranscode(session: Session, variantIndex: number, startSegment: number) {
    const { ffmpeg } = await this.getConfig({ withCache: true });

    const asset = await this.videoStreamRepository.getForTranscoding(session.assetId);
    if (!asset) {
      this.logger.error(`Asset ${session.assetId} not found for HLS transcoding`);
      return;
    }

    if (session.variantIndex !== variantIndex || session.startSegment !== startSegment) {
      return;
    }

    const variant = HLS_VARIANTS[variantIndex];
    if (!variant) {
      this.logger.error(`Variant ${variantIndex} out of range for asset ${session.assetId}`);
      await this.failSession(session, `Invalid variant index ${variantIndex}`);
      return;
    }

    const variantDir = StorageCore.getHlsVariantFolder({
      ownerId: session.ownerId,
      sessionId: session.id,
      variantIndex,
    });
    this.storageRepository.mkdirSync(variantDir);

    // Encoder runs at fps = packetCount × timeBase / totalDuration with
    // gop = ceil(SEGMENT_DURATION × fps). To start segment K's content at
    // exactly cfr slot K × gop, seek to the midpoint between slots K×gop−1 and
    // K×gop. accurate_seek's "discard < target" then keeps the source frame
    // that quantizes to slot K×gop and discards the one quantizing to K×gop−1.
    const fps = (asset.packets.packetCount * asset.videoStream.timeBase) / asset.packets.totalDuration;
    const gop = Math.ceil(HLS_SEGMENT_DURATION * fps);
    const seekSeconds = startSegment > 0 ? (startSegment * gop - 0.5) / fps : 0;

    let config;
    try {
      config = BaseConfig.create(
        {
          ...ffmpeg,
          targetVideoCodec: variant.codec,
          targetResolution: String(variant.resolution),
          maxBitrate: `${Math.round(variant.bitrate / 1000)}k`,
          gopSize: gop,
          crf: HLS_CRF[variant.codec],
        },
        this.videoInterfaces,
        { strictGop: true, lowLatency: true },
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to create transcode config for variant ${variantIndex} asset ${session.assetId}: ${error?.message ?? error}`,
      );
      await this.failSession(session, `Failed to start transcode: ${error?.message ?? 'unknown error'}`);
      return;
    }
    const args = config.getHlsCommand(
      {
        initFilename: 'init.mp4',
        inputPath: asset.originalPath,
        packetCount: asset.packets.packetCount,
        playlistFilename: join(variantDir, 'playlist.m3u8'),
        seekSeconds,
        segmentDuration: HLS_SEGMENT_DURATION,
        segmentFilename: join(variantDir, 'seg_%d.m4s'),
        startSegment,
        target: TranscodeTarget.All,
        timeBase: asset.videoStream.timeBase,
        totalDuration: asset.packets.totalDuration,
      },
      asset.videoStream,
      asset.audioStream ?? undefined,
    );
    this.logger.log(
      `Starting HLS transcode for asset ${session.assetId} variant ${variantIndex} with command: ffmpeg ${args.join(' ')}`,
    );
    const process = this.processRepository.spawn('ffmpeg', args, { stdio: ['ignore', 'ignore', 'pipe'] });
    this.attachProcessHandlers(process, session, variantIndex);
    return process;
  }

  private failSession(session: Session, error: string) {
    this.websocketRepository.serverSend('HlsSessionResult', { sessionId: session.id, error });
    return this.onSessionEnd({ sessionId: session.id });
  }

  private attachProcessHandlers(process: ChildProcess, session: Session, variantIndex: number) {
    let stderr = '';
    const variantDir = StorageCore.getHlsVariantFolder({
      ownerId: session.ownerId,
      sessionId: session.id,
      variantIndex,
    });

    // hlsenc writes each segment as `seg_K.m4s.tmp` then renames to
    // `seg_K.m4s`. The rename event fires the moment the renamed file is
    // observable — the only signal we need to tell the API worker the
    // segment is ready to serve.
    const watcher = this.storageRepository.watchDir(variantDir, (eventType, filename) => {
      if (eventType !== 'rename' || !filename || session.process !== process) {
        return;
      }
      const match = HLS_SEGMENT_FILENAME_REGEX.exec(filename);
      if (!match) {
        return;
      }
      const segmentIndex = Number.parseInt(match[1]);
      const expected = session.lastCompletedSegment === null ? session.startSegment : session.lastCompletedSegment + 1;
      // Ignore stale events from old process after seek
      if (expected === null || segmentIndex !== expected) {
        return;
      }
      session.lastCompletedSegment = segmentIndex;
      this.websocketRepository.serverSend('HlsSegmentResult', {
        sessionId: session.id,
        variantIndex,
        segmentIndex,
      });
      this.applyBackpressure(session);
    });
    watcher.on('error', (error) => {
      this.logger.error(`watcher error for ${variantDir}: ${error}`);
    });

    process.stderr!.on('data', (chunk: Buffer) => {
      if (session.process !== process) {
        return;
      }
      stderr += chunk.toString();
    });

    process.on('exit', (code) => {
      watcher.close();
      if (session.process !== process || session.variantIndex !== variantIndex) {
        return;
      }
      session.paused = false;
      session.process = null;
      session.lastCompletedSegment = null;
      if (code) {
        this.logger.error(
          `FFmpeg exited with code ${code} for variant ${variantIndex} asset ${session.assetId}\n${stderr}`,
        );
        void this.failSession(session, `Transcoding process exited unexpectedly with code ${code}`).catch((error) =>
          this.logger.error(`Failed to end session ${session.id} after ffmpeg exit: ${error}`),
        );
      }
    });
  }

  private stopTranscode(session: Session) {
    if (!session.process) {
      return;
    }
    // SIGTERM makes it rename .tmp segments to .m4s even if they're still incomplete
    session.process.kill('SIGKILL');
    session.process = null;
    session.lastCompletedSegment = null;
    session.paused = false;
    this.logger.debug(`Stopped transcoding for session ${session.id}`);
  }

  private pauseTranscode(session: Session) {
    if (session.paused || !session.process) {
      return;
    }
    session.process.kill('SIGSTOP');
    session.paused = true;
    this.logger.debug(`Paused transcoding for session ${session.id}`);
  }

  private resumeTranscode(session: Session) {
    if (!session.paused || !session.process) {
      return;
    }
    session.process.kill('SIGCONT');
    session.paused = false;
    this.logger.debug(`Resumed transcoding for session ${session.id}`);
  }

  private async removeSessionDir(session: { ownerId: string; id: string }) {
    const dir = StorageCore.getHlsSessionFolder({ ownerId: session.ownerId, sessionId: session.id });
    try {
      await this.storageRepository.unlinkDir(dir, { recursive: true, force: true });
    } catch (error) {
      if ((error as NodeJS.ErrnoException)?.code !== 'ENOENT') {
        throw error;
      }
      this.logger.warn(`Session dir ${dir} does not exist.`);
    }
  }

  private removeInactiveSessions() {
    const cutoff = Date.now() - HLS_INACTIVITY_TIMEOUT_MS;
    const inactiveSessions = this.sessions.values().filter((s) => s.lastActivityTime.getTime() < cutoff);
    return Promise.all(
      inactiveSessions.map(async (session) => {
        try {
          this.websocketRepository.serverSend('HlsSessionEnd', { sessionId: session.id });
          await this.onSessionEnd({ sessionId: session.id });
        } catch (error) {
          this.logger.error(`Failed to sweep inactive HLS session ${session.id}: ${error}`);
        }
      }),
    );
  }

  private removeExpiredSessions() {
    return this.databaseRepository.withLock(DatabaseLock.HlsSessionCleanup, async () => {
      const expiredSessions = await this.videoStreamRepository.getExpiredSessions();
      await Promise.all(
        expiredSessions.map(async (session) => {
          await this.removeSessionDir(session);
          await this.videoStreamRepository.deleteSession(session.id);
        }),
      );
    });
  }
}
