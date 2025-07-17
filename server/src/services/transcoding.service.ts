import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { sign } from 'jsonwebtoken';
import child_process from 'node:child_process';
import { createWriteStream } from 'node:fs';
import fs from 'node:fs/promises';
import { OnEvent } from 'src/decorators';
import { AuthDto } from 'src/dtos/auth.dto';
import { AssetType, AudioCodec, Permission, TranscodeTarget, VideoCodec } from 'src/enum';
import { BaseService } from 'src/services/base.service';
import { VideoInfo, VideoInterfaces } from 'src/types';
import { BaseConfig } from 'src/utils/media';
import { ChildProcess } from 'child_process';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { SystemConfigFFmpegDto } from 'src/dtos/system-config.dto';
import { Asset } from 'src/database';

type VideoStream = VideoInfo['videoStreams'][0];
type AudioStream = VideoInfo['audioStreams'][0];

class PartManager {
}

// There is actually no persistent "connection"
class HLSConnection {
  private firstSegmentDone?: PromiseWithResolvers<void>;
  private ffmpegTerminated?: PromiseWithResolvers<void>;
  private ffmpegCommand?: ChildProcess;

  private keyTimes?: number[];
  private partTimes?: number[];

  private vQuality: string;
  private aQuality: string;
  private _lastSegmentIdx = 0;

  private inputPath: string;
  private id: string;

  // Doubtful but okay
  private logger: LoggingRepository;
  private liveFfmpegConfig: SystemConfigFFmpegDto;

  // This is placeholder
  private vPlaylist: string;
  private aPlaylist: string;

  private sessionId: string;

  private parts: PartManager

  constructor(logger: LoggingRepository, sessionId: string, liveFfmpegConfig: SystemConfigFFmpegDto, asset: Asset) {
    this.logger = logger;
    this.sessionId = sessionId;
    this.liveFfmpegConfig = { ...liveFfmpegConfig };
    this.liveFfmpegConfig.gopSize = -1; // There is force_key_frames for this task.

    this.inputPath = asset.originalPath;
    this.id = asset.id;

    this.parts = new PartManager();

    const asset = await this.assetRepository.getById(id);
    if (!asset) {
      throw new NotFoundException('Asset not found');
    }

    // prettier-ignore
    const s = child_process.spawn('ffprobe', [
      '-loglevel', 'error',
      '-select_streams', 'v:0',
      '-show_entries', 'packet=pts_time,flags',
      '-of', 'csv=print_section=0',
      asset.originalPath,
    ]);
    const frames: number[] = [];

    let lines = '';
    await new Promise<void>((resolve, reject) => {
      s.stdout.on('data', (buf: Buffer) => {
        lines += buf.toString();
      });
      s.on('exit', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new InternalServerErrorException('Can\'t decode video'));
        }
      });
    });

    for (const data of lines.split('\n')) {
      if (!data) {
        continue;
      }
      const [time_, type] = data.split(',');

      const time = Number.parseFloat(time_) * (type.startsWith('K') ? -1 : 1);
      frames.push(time);
    }
    if (frames.length === 0) {
      throw new NotFoundException('Video has no frames');
    }
    frames.sort((a, b) => Math.abs(a) - Math.abs(b));

    this.generatePlaylists(frames);
  }

  private generatePlaylists(frames: number[]) {
    const videoPlaylist = [
      '#EXTM3U',
      '#EXT-X-VERSION:10',
      '#EXT-X-MEDIA-SEQUENCE:0',
      '#EXT-X-TARGETDURATION:10',
      '#EXT-X-PART-INF:PART-TARGET=0.5',
      '#EXT-X-PLAYLIST-TYPE:VOD',
    ];
    const audioPlaylist = videoPlaylist;

    videoPlaylist.push(`#EXT-X-MAP:URI="%codec%/%quality%/init.mp4"`);
    audioPlaylist.push(`#EXT-X-MAP:URI="%codec%/%quality%/init.mp4"`);
    this.audioCodec;

    let prevPart = frames[0];
    let prevSeg = frames[0];
    let partIdx = 0;
    let prevPartIdx = 0;

    const original = quality == 'original';
    for (let i = 1; i < frames.length - 1; i++) {
      const isKf = frames[i] <= 0;
      frames[i] = Math.abs(frames[i]);
      if (!original && (frames[i] - prevPart > 0.5 || isKf)) {
        this.partTimes.push(i + 1);

        videoPlaylist.push(
          `#EXT-X-PART:DURATION=${(frames[i] - prevPart).toFixed(20)},URI="%codec%/%quality%/${partIdx++}.mp4"${prevPart === prevSeg ? ',INDEPENDENT=YES' : ''}`,
        );
        prevPart = frames[i];
      }

      if (isKf && frames[i] - prevSeg > 10) {
        if (original) {
          this.partTimes.push(i);
        }

        this.keyTimes.push(frames[i]);

        // TODO: If client decides to request full part, then we have to concat it using concat muxer
        videoPlaylist.push(
          `#EXTINF:${(frames[i] - prevSeg).toFixed(20)},`,

          // This is placeholder
          `%codec%/%quality%/${Array.from({ length: partIdx - prevPartIdx }, (_, i) => prevPartIdx + i).join('.')}.mp4`,
        );
        prevPart = prevSeg = frames[i];
        prevPartIdx = partIdx;
      }
    }
    this.vPlaylist = videoPlaylist.join('\n');
    this.aPlaylist = audioPlaylist.join('\n');
  }

  get videoCodec(): VideoCodec | undefined {
    return this.vQuality ? liveFfmpegConfig.targetVideoCodec : undefined;
  }

  get audioCodec(): AudioCodec | undefined {
    return this.aQuality ? liveFfmpegConfig.targetAudioCodec : undefined;
  }

  get videoQuality() {
    return this.vQuality;
  }

  get audioQuality() {
    return this.aQuality;
  }

  // This method should be called ONLY when client switches playlist
  updateVideoStream(videoCodec: VideoCodec, videoQuality: string) {
    this.logger.debug(`Client ${this.sessionId} switched video from ${this.videoCodec}:${this.vQuality} to ${videoCodec}:${videoQuality}`);

    this._videoCodec = videoCodec;
    this.vQuality = videoQuality;

    this.tryStartTranscoding();
  }

  updateAudioStream(audioCodec: VideoCodec, audioQuality: string) {
    this.logger.debug(`Client ${this.sessionId} switched audio from ${this.audioCodec}:${this.aQuality} to ${audioCodec}:${audioQuality}`);

    this._audioCodec = audioCodec;
    this.aQuality = audioQuality;

    this.tryStartTranscoding();
  }

  private tryStartTranscoding() {
    if (!this.vQuality || !this.aQuality) {
      this.logger.debug(`Client ${this.sessionId} is not selected output audio/video yet`);
      return;
    }

    this.ffmpegCommand?.kill();
    if (this.ffmpegTerminated) { // Means there is another working instance of ffmpeg
      this.firstSegmentDone = Promise.withResolvers<void>();
    }
    await this.ffmpegTerminated?.promise;
    this.ffmpegTerminated = Promise.withResolvers<void>();

    this.logger.debug(`Started transcoding video ${path}, requested video ${this.videoCodec}:${this.vQuality}, audio ${this.audioCodec}:${this.aQuality}, session ${this.sessionId}`);
    await fs.mkdir(`/tmp/video/${this.sessionId}/${this.videoCodec}/${this.videoQuality}`, {
      mode: 0o600,
      recursive: true,
    });
    await fs.mkdir(`/tmp/video/${this.sessionId}/${this.audioCodec}/${this.audioQuality}`, {
      mode: 0o600,
      recursive: true,
    });

    const stats = await this.mediaRepository.probe(path);
    if (stats.videoStreams.length === 0) {
      throw new NotFoundException('No video streams in file');
    }
    const videoStream = stats.videoStreams[0];
    const audioStream = stats.audioStreams[0];

    const args = ['-nostats', '-hide_banner', '-loglevel', 'warning'];
    if (quality === 'original') {
      args.push('-c:v', 'copy');
    } else {
      const options = BaseConfig.create(liveFfmpeg, this.videoInterfaces).getCommand(
        TranscodeTarget.Video,
        videoStream,
        undefined, // We will handle audio later
      );
      for (const option of options.inputOptions) {
        args.push(...option.split(' '));
      }
      args.push('-i', path);
      args.push(
        '-start_at_zero',
        '-copyts',
        '-muxdelay', '0',
      );
      for (const option of options.outputOptions) {
        args.push(...option.split(' '));
      }

      // prettier-ignore
      args.push(
        '-maxrate', '4000k',
        '-bufsize', '20000k',
      );
    }

    // prettier-ignore
    args.push(
      '-f', 'segment',
      '-an',
      '-segment_format', 'mp4',
      '-segment_list_type', 'csv',

      '-break_non_keyframes', '1',
      '-segment_frames', this.partTimes.join(','),
      '-force_key_frames', this.keyTimes.join(','),

      '-segment_header_filename', `/tmp/video/${this.sessionId}/${this.videoCodec}/${this.videoQuality}/init.mp4`,
      '-segment_format_options', 'movflags=dash+skip_sidx',
      '-segment_list', 'pipe:1',

      '-strict', '-2',
      `/tmp/video/${this.sessionId}/${this.videoCodec}/${this.videoQuality}/%d.mp4`,
    );
    if (audioStream) {
      args.push(
        '-map', 'a:1',
        '-f', 'segment',
        '-vn',
        '-segment_format', 'mp4',
        '-segment_list_type', 'csv',

        '-segment_times', this.keyTimes?.join(','),

        '-segment_header_filename',
        `/tmp/video/${this.sessionId}/${this.audioCodec}/${this.audioQuality}/init.mp4`,

        '-segment_format_options', 'movflags=dash+skip_sidx',
        '-segment_list', 'pipe:1',

        `/tmp/video/${this.sessionId}/${this.audioCodec}/${this.audioQuality}/%d.mp4`,
      );
    }

    const s = child_process.spawn('ffmpeg', args);
    s.stdout.on('data', (bytes) => {
      const data = bytes.toString('utf8');
      for (const line of data.split('\n')) {
        if (line) {
          const name = line.split(',')[0];
          const idx = name.split('.')[0];

          if (idx == '0') {
            this.transcoderFirstSegmentReady();
          }
          this.logger.debug(`Segment ${idx} ready`);
        }
      }
    });
    const log = createWriteStream(`/tmp/video/${this.id}/transcoding.log`);
    s.stderr.pipe(log);
    s.on('exit', (code) => {
      if (code === 0) {
        this.logger.debug(`Finished live transcoding of video ${this.inputPath}`);
      } else {
        this.logger.error(`Can't live transcode video ${this.inputPath}`);
      }
      log.close();
      this.ffmpegTerminated?.resolve();
    });
  }

  transcoderFirstSegmentReady() {
    this.firstSegmentDone?.resolve();
  }

  waitForFirstSegment() {
    return this.firstSegmentDone?.promise;
  }

  get videoPlaylist() {
    return this.vPlaylist.replace('%quality%', this.vQuality).replace('%codec%', this.videoCodec?.toString() ?? '');
  }

  get audioPlaylist() {
    return this.aPlaylist.replace('%quality%', this.aQuality).replace('%codec%', this.audioCodec?.toString() ?? '');
  }
}

@Injectable()
export class TranscodingService extends BaseService {
  SUPPORTED_TAGS = ['avc1', 'hvc', 'dvh1'];
  AVC_PROFILES: { [key: string]: string } = { high: '.6400', main: '.4D40', baseline: '.42E0' };
  videoInterfaces: VideoInterfaces = { dri: [], mali: false };

  connections: Map<string, HLSConnection> = new Map();

  // https://github.com/zoriya/Kyoo/blob/d08febf803e307da1277996f7856bd901b6e83e2/transcoder/src/codec.go#L18
  videoStreamToMime(stream: VideoStream): string {
    let res = stream.codecTag;
    if (!res) {
      throw new Error('Codec tag is undefined');
    }

    if (stream.codecTag == 'avc1') {
      res += this.AVC_PROFILES[stream.profile?.toLowerCase() ?? 'unknown'] ?? '.4240';
      res += stream.level.toString().padStart(2, '0');
    }
    // TODO: h265
    return res;
  }

  audioStreamToMime(stream: AudioStream) {
    // TODO: opus and ac3
    if (stream.codecName === 'aac') {
      return 'mp4a.40.34';
    }
  }

  async getMasterPlaylist(id: string, sessionId: string): Promise<string> {
    const playlist = [];

    const asset = await this.assetRepository.getById(id);
    if (!asset) {
      throw new NotFoundException('Asset not found');
    }

    const stats = await this.mediaRepository.probe(asset.originalPath);
    if (stats.videoStreams.length === 0) {
      throw new NotFoundException('No video streams in file');
    }

    const config = await this.getConfig({ withCache: true });
    const connection = new HLSConnection(this.logger, sessionId, config.liveFfmpeg, asset);
    this.connections.set(sessionId, connection);

    const videoStream = stats.videoStreams[0];
    const audioStream = stats.audioStreams.length > 0 ? stats.audioStreams[0] : undefined;

    playlist.push(
      '#EXTM3U',
      '#EXT-X-VERSION:10',
      '#EXT-X-INDEPENDENT-SEGMENTS',

      `#EXT-X-STREAM-INF:BANDWIDTH=56320,CODECS="mp4a.40.5"`,
      `aac/55.m3u8`,

      `#EXT-X-STREAM-INF:BANDWIDTH=14358365,CODECS="avc1.64001e,mp4a.40.2",RESOLUTION=1920x1080,FRAME-RATE=30`,
      `h264/1080p.m3u8`,
    );

    if (videoStream.codecTag && this.SUPPORTED_TAGS.includes(videoStream.codecTag)) {
      playlist.push(
        `#EXT-X-STREAM-INF:BANDWIDTH=${videoStream.bitrate},CODECS="${this.videoStreamToMime(videoStream)}${audioStream ? ', ' + this.audioStreamToMime(audioStream) : ''}",RESOLUTION=${videoStream.width}x${videoStream.height},FRAME-RATE=${videoStream.fps}`,
        `original.m3u8`,
      );
    }
    return playlist.join('\n');
  }

  async getVideoPlaylist(
    id: string,
    sessionId: string,
    codec: VideoCodec,
    quality: string,
  ): Promise<string> {
    const connection = this.connections.get(sessionId);
    if (!connection) {
      throw new BadRequestException('Not connected');
    }
    connection.updateVideoStream(codec, quality);

    await connection.waitForFirstSegment();
    return connection.videoPlaylist;
  }

  async getAudioPlaylist(
    id: string,
    sessionId: string,
    codec: VideoCodec,
    quality: string,
  ): Promise<string> {
    const connection = this.connections.get(sessionId);
    if (!connection) {
      throw new BadRequestException('Not connected');
    }
    connection.updateAudioStream(codec, quality);

    await connection.waitForFirstSegment();
    return connection.audioPlaylist;
  }

  // From media.serivce.ts
  @OnEvent({ name: 'app.bootstrap' })
  async onBootstrap() {
    const [dri, mali] = await Promise.all([this.getDevices(), this.hasMaliOpenCL()]);
    this.videoInterfaces = { dri, mali };
  }

  async getPlaylistUrl(auth: AuthDto, id: string): Promise<string> {
    await this.requireAccess({ auth, permission: Permission.ASSET_VIEW, ids: [id] });

    const asset = await this.assetRepository.getById(id);
    if (!asset) {
      throw new NotFoundException('Asset not found');
    }
    if (asset.type !== AssetType.VIDEO) {
      throw new BadRequestException('Asset is not a video');
    }

    const secret = await this.systemMetadataRepository.getSecretKey();

    // Session ID is base64-encoded 16 bytes
    return `/api/playback/${sign(
      {
        id,
        path: asset.originalPath,
        sessionId: this.cryptoRepository.randomBytesAsText(16),
      },
      secret,
    )}/master.m3u8`;
  }

  private async hasMaliOpenCL() {
    try {
      const [maliIcdStat, maliDeviceStat] = await Promise.all([
        this.storageRepository.stat('/etc/OpenCL/vendors/mali.icd'),
        this.storageRepository.stat('/dev/mali0'),
      ]);
      return maliIcdStat.isFile() && maliDeviceStat.isCharacterDevice();
    } catch {
      this.logger.debug('OpenCL not available for transcoding, so RKMPP acceleration will use CPU tonemapping');
      return false;
    }
  }

  private async getDevices() {
    try {
      return await this.storageRepository.readdir('/dev/dri');
    } catch {
      this.logger.debug('No devices found in /dev/dri.');
      return [];
    }
  }
}
