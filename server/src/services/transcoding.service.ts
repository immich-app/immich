import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { sign } from 'jsonwebtoken';
import child_process, { ChildProcessWithoutNullStreams } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import fs from 'node:fs/promises';
import { Asset } from 'src/database';
import { OnEvent } from 'src/decorators';
import { AuthDto } from 'src/dtos/auth.dto';
import { SystemConfigFFmpegDto } from 'src/dtos/system-config.dto';
import { AssetType, AudioCodec, Permission, TranscodeTarget, VideoCodec } from 'src/enum';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { BaseService } from 'src/services/base.service';
import { VideoInfo, VideoInterfaces } from 'src/types';
import { BaseConfig } from 'src/utils/media';

type VideoStream = VideoInfo['videoStreams'][0];
type AudioStream = VideoInfo['audioStreams'][0];

class FFmpegInstance {
  private firstSegmentDone?: PromiseWithResolvers<void>;
  private ffmpegTerminated?: PromiseWithResolvers<void>;
  private ffmpegCommand?: ChildProcessWithoutNullStreams;
  args: string[];
  logger: LoggingRepository;
  sessionId: string;
  inputPath: string;
  logPath: string;

  constructor(args: string[], logger: LoggingRepository, sessionId: string, inputPath: string, logPath: string) {
    this.args = args;
    this.logger = logger;
    this.sessionId = sessionId;
    this.inputPath = inputPath;
    this.logPath = logPath;
  }

  waitForFirstSegment() {
    return this.firstSegmentDone?.promise;
  }

  kill() {
    this.ffmpegCommand?.kill();
  }

  run() {
    this.ffmpegCommand = child_process.spawn('ffmpeg', this.args);
    this.ffmpegCommand.stdout.on('data', (bytes) => {
      const data = bytes.toString('utf8');
      for (const line of data.split('\n')) {
        if (line) {
          const name = line.split(',')[0];
          const idx = name.split('.')[0];

          if (idx == '0') {
            this.firstSegmentDone?.resolve();
          }
          this.logger.debug(`Segment ${idx} ready, session: ${this.sessionId}`);
        }
      }
    });
    const log = createWriteStream(this.logPath);
    this.ffmpegCommand.stderr.pipe(log);
    this.ffmpegCommand.on('exit', (code) => {
      if (code === 0) {
        this.logger.debug(`Finished live transcoding of video ${this.inputPath}`);
      } else {
        this.logger.error(`Can't live transcode video ${this.inputPath}`);
      }
      log.close();
      this.ffmpegTerminated?.resolve();
    });
  }
}

class PartManager {}

// There is actually no persistent "connection"
class HLSConnection {
  private readonly SEGMENT_TARGET_TIME = 2;

  ffmpegCommands: { video?: FFmpegInstance; audio?: FFmpegInstance } = {};

  private keyTimes: number[] = [];
  private partTimes: number[] = [];
  private segTimes: number[] = [];

  private videoInterfaces: VideoInterfaces;

  private vQuality?: string;
  private aQuality?: string;
  private _lastSegmentIdx = 0;

  private inputPath: string;
  private id: string;

  private stats: VideoInfo;

  // Doubtful but okay
  private logger: LoggingRepository;
  private liveFfmpegConfig: SystemConfigFFmpegDto;

  // This is placeholder
  private vPlaylist?: string;
  private aPlaylist?: string;

  private sessionId: string;

  private parts: PartManager;

  constructor(
    logger: LoggingRepository,
    sessionId: string,
    liveFfmpegConfig: SystemConfigFFmpegDto,
    asset: Asset,
    videoInterfaces: VideoInterfaces,
    stats: VideoInfo,
  ) {
    this.logger = logger;
    this.sessionId = sessionId;
    this.liveFfmpegConfig = { ...liveFfmpegConfig };
    this.liveFfmpegConfig.gopSize = -1; // There is force_key_frames for this task.

    this.inputPath = asset.originalPath;
    this.id = asset.id;
    this.stats = stats;
    this.videoInterfaces = videoInterfaces;

    this.parts = new PartManager();
  }

  async generatePlaylists() {
    if (this.vPlaylist) {
      return;
    }

    // prettier-ignore
    const s = child_process.spawn('ffprobe', [
      '-loglevel', 'error',
      '-select_streams', 'v:0',
      '-show_entries', 'packet=pts_time,flags',
      '-of', 'csv=print_section=0',
      this.inputPath,
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
          reject(new InternalServerErrorException("Can't decode video"));
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

    const videoPlaylist = [
      '#EXTM3U',
      '#EXT-X-VERSION:10',
      '#EXT-X-MEDIA-SEQUENCE:0',
      '#EXT-X-TARGETDURATION:2',
      '#EXT-X-PART-INF:PART-TARGET=0.5',
      '#EXT-X-PLAYLIST-TYPE:VOD',
      `#EXT-X-MAP:URI="init.mp4"`,
    ];
    const audioPlaylist = [...videoPlaylist];

    let l = 0;
    let r = 1;
    let partIdx = 0;
    let possibleParts = [0];

    const getPartAt = (at: number) => {
      return Math.abs(possibleParts.at(at)!);
    };

    const isPartMarked = (at: number) => {
      return possibleParts[at] < 0;
    };

    const markPart = (at: number) => {
      possibleParts[at] = -possibleParts[at];
    };

    this.keyTimes.push(0);
    this.segTimes.push(0);

    if (frames.at(-1)! < 0) {
      frames.push(-frames.at(-1)!); // This is fake keyframe to finish playlist
    }
    while (r < frames.length) {
      const isKf = frames[r] <= 0;
      frames[r] = Math.abs(frames[r]);
      if (frames[r] - getPartAt(-1)! > 0.5) {
        possibleParts.push(frames[r]);
        if (frames[r] - this.keyTimes.at(-1)! > this.SEGMENT_TARGET_TIME) {
          this.keyTimes.push(frames[r]); // Anyway it will be ignored when -c:v copy

          markPart(possibleParts.length - 1);
        }
      }

      if (isKf) {
        // Recommened segment time by RFC is 2 seconds
        // Otherwise we will split it to parts
        if (frames[r] - frames[l] > 2) {
          for (let i = 1; i < possibleParts.length; i++) {
            const independent = isPartMarked(i) && i + 2 < possibleParts.length; // There is no necessary to add I-frame for 1 second
            videoPlaylist.push(
              `#EXT-X-PART:DURATION=${(getPartAt(i) - getPartAt(i - 1)).toFixed(5)},URI="${partIdx++}.mp4"${independent ? '%independent%' : ''}`,
            );
            possibleParts[i] = Math.abs(possibleParts[i]);
          }
          videoPlaylist.push(
            `#EXTINF:${(frames[r] - frames[l]).toFixed(5)}`,
            Array.from({ length: possibleParts.length - 1 }, (_, i) => partIdx - possibleParts.length + i + 1).join(
              '.',
            ) + '.mp4',
          );
          this.keyTimes.push(frames[r]);
          this.partTimes.push(...possibleParts.slice(1));
          this.segTimes.push(frames[r]);
        } else {
          this.partTimes.push(frames[r]);
          this.keyTimes.push(frames[r]);
          this.segTimes.push(frames[r]);
          videoPlaylist.push(`#EXTINF:${(frames[r] - frames[l]).toFixed(5)}`, `${partIdx++}.mp4`);
        }
        possibleParts = [frames[r]];
        l = r;
      }
      r++;
    }

    let audioSegIdx = 0;
    for (let i = 1; i < this.segTimes.length; i++) {
      audioPlaylist.push(`#EXTINF:${(this.segTimes[i] - this.segTimes[i - 1]).toFixed(5)}`, `${audioSegIdx++}.mp4`);
    }

    this.vPlaylist = videoPlaylist.join('\n');
    this.aPlaylist = audioPlaylist.join('\n');
  }

  get videoCodec(): VideoCodec | undefined {
    return this.vQuality ? this.liveFfmpegConfig.targetVideoCodec : undefined;
  }

  get audioCodec(): AudioCodec | undefined {
    return this.aQuality ? this.liveFfmpegConfig.targetAudioCodec : undefined;
  }

  get videoQuality() {
    return this.vQuality;
  }

  get audioQuality() {
    return this.aQuality;
  }

  // This method should be called ONLY when client switches playlist
  async updateVideoStream(videoCodec: VideoCodec, videoQuality: string) {
    if (videoCodec == this.videoCodec && videoQuality == this.videoQuality) {
      return;
    }
    this.logger.debug(
      `Client ${this.sessionId} switched video from ${this.videoCodec}:${this.vQuality} to ${videoCodec}:${videoQuality}`,
    );

    this.liveFfmpegConfig.targetVideoCodec = videoCodec;
    this.vQuality = videoQuality;

    this.ffmpegCommands.video?.kill();
    await this.startTranscodingVideo();
  }

  async updateAudioStream(audioCodec: AudioCodec, audioQuality: string) {
    this.logger.debug(
      `Client ${this.sessionId} switched audio from ${this.audioCodec}:${this.aQuality} to ${audioCodec}:${audioQuality}`,
    );

    this.liveFfmpegConfig.targetAudioCodec = audioCodec;
    this.aQuality = audioQuality;

    this.ffmpegCommands.audio?.kill();
    await this.startTranscodingAudio();
  }

  private async startTranscodingVideo() {
    if (!this.vQuality) {
      this.logger.debug(`Client ${this.sessionId} is not selected output audio yet`);
      return;
    }

    this.logger.debug(
      `Started transcoding video ${this.inputPath}, requested video ${this.videoCodec}:${this.vQuality}, session ${this.sessionId}`,
    );
    await fs.mkdir(`/tmp/video/${this.sessionId}/${this.videoCodec}/${this.videoQuality}`, {
      mode: 0o700,
      recursive: true,
    });

    const videoStream = this.stats.videoStreams[0];
    const args = ['-nostats', '-hide_banner', '-loglevel', 'warning'];
    if (this.videoQuality === 'original') {
      // prettier-ignore
      args.push(
        '-c:v', 'copy',
        '-start_at_zero',
        '-copyts',
        '-muxdelay', '0'
      );
    } else {
      const options = BaseConfig.create(this.liveFfmpegConfig, this.videoInterfaces).getCommand(
        TranscodeTarget.VIDEO,
        videoStream,
        // We will handle audio later
      );
      for (const option of options.inputOptions) {
        args.push(...option.split(' '));
      }

      // prettier-ignore
      args.push(
        '-i', this.inputPath,

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
      '-enc_time_base', 'demux',
      '-an',
      '-segment_format', 'mp4',
      '-segment_list_type', 'csv',

      '-break_non_keyframes', '1',
      '-segment_times', this.partTimes!.join(','),
      '-force_key_frames', this.keyTimes!.join(','),

      '-segment_header_filename', `/tmp/video/${this.sessionId}/${this.videoCodec}/${this.videoQuality}/init.mp4`,
      '-segment_format_options', 'movflags=dash+skip_sidx',
      '-segment_list', 'pipe:1',
      '-segment_time_delta', '0.0001',

      '-strict', '-2',
      `/tmp/video/${this.sessionId}/${this.videoCodec}/${this.videoQuality}/%d.mp4`,
    );

    const instance = new FFmpegInstance(
      args,
      this.logger,
      this.sessionId,
      this.inputPath,
      `/tmp/video/${this.sessionId}/${this.videoCodec}/${this.videoQuality}/transcoding.log`,
    );
    instance.run();
    this.ffmpegCommands.video = instance;
  }

  private async startTranscodingAudio() {
    if (!this.aQuality) {
      this.logger.debug(`Client ${this.sessionId} is not selected output audio yet`);
      return;
    }

    this.logger.debug(
      `Started transcoding video ${this.inputPath}, requested video ${this.videoCodec}:${this.vQuality}, session ${this.sessionId}`,
    );
    await fs.mkdir(`/tmp/video/${this.sessionId}/${this.audioCodec}/${this.audioQuality}`, {
      mode: 0o700,
      recursive: true,
    });

    const args = ['-nostats', '-hide_banner', '-loglevel', 'warning', '-i', this.inputPath];
    if (this.audioQuality === 'original') {
      args.push('-c:a', 'copy');
    } else {
      // prettier-ignore
      args.push(
        '-start_at_zero',
        '-copyts',
        '-muxdelay', '0',
      );
    }

    // prettier-ignore
    args.push(
        '-map', '0:a:0',
        '-f', 'segment',
        '-vn',
        '-segment_format', 'mp4',
        '-segment_list_type', 'csv',

        '-segment_times', this.keyTimes!.join(','),

        '-segment_header_filename',
        `/tmp/video/${this.sessionId}/${this.audioCodec}/${this.audioQuality}/init.mp4`,

        '-segment_format_options', 'movflags=dash+skip_sidx',
        '-segment_list', 'pipe:1',

        `/tmp/video/${this.sessionId}/${this.audioCodec}/${this.audioQuality}/%d.mp4`,
      );

    const instance = new FFmpegInstance(
      args,
      this.logger,
      this.sessionId,
      this.inputPath,
      `/tmp/video/${this.sessionId}/${this.videoCodec}/${this.videoQuality}/transcoding.log`,
    );
    instance.run();
    this.ffmpegCommands.audio = instance;
  }

  get videoPlaylist() {
    if (!this.vPlaylist) {
      throw new Error('Сall generatePlaylists() before videoPlaylist');
    }
    return this.vPlaylist.replaceAll('%independent%', this.vQuality == 'original' ? '' : ',INDEPENDENT=YES');
  }

  get audioPlaylist() {
    if (!this.aPlaylist) {
      throw new Error('Сall generatePlaylists() before audioPlaylist');
    }
    return this.aPlaylist;
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
    const connection = new HLSConnection(this.logger, sessionId, config.liveFfmpeg, asset, this.videoInterfaces, stats);
    await connection.generatePlaylists();

    this.connections.set(sessionId, connection);

    const videoStream = stats.videoStreams[0];
    const audioStream = stats.audioStreams.length > 0 ? stats.audioStreams[0] : undefined;

    playlist.push(
      '#EXTM3U',
      '#EXT-X-VERSION:10',
      '#EXT-X-INDEPENDENT-SEGMENTS',

      `#EXT-X-STREAM-INF:BANDWIDTH=56320,CODECS="mp4a.40.5"`,
      `a/aac/55/playlist.m3u8`,

      `#EXT-X-STREAM-INF:BANDWIDTH=14358365,CODECS="avc1.64001e,mp4a.40.2",RESOLUTION=1920x1080,FRAME-RATE=30`,
      `h264/1080p/playlist.m3u8`,
    );

    if (videoStream.codecTag && this.SUPPORTED_TAGS.includes(videoStream.codecTag)) {
      playlist.push(
        `#EXT-X-STREAM-INF:BANDWIDTH=${videoStream.bitrate},CODECS="${this.videoStreamToMime(videoStream)}${audioStream ? ', ' + this.audioStreamToMime(audioStream) : ''}",RESOLUTION=${videoStream.width}x${videoStream.height},FRAME-RATE=${videoStream.fps}`,
        `h264/original/playlist.m3u8`,
      );
    }
    return playlist.join('\n');
  }

  async getVideoPlaylist(id: string, sessionId: string, codec: VideoCodec, quality: string): Promise<string> {
    const connection = this.connections.get(sessionId);
    if (!connection) {
      throw new BadRequestException('Not connected');
    }
    await connection.updateVideoStream(codec, quality);

    await connection.ffmpegCommands.video!.waitForFirstSegment();
    return connection.videoPlaylist;
  }

  async getAudioPlaylist(id: string, sessionId: string, codec: AudioCodec, quality: string): Promise<string> {
    const connection = this.connections.get(sessionId);
    if (!connection) {
      throw new BadRequestException('Not connected');
    }
    await connection.updateAudioStream(codec, quality);

    await connection.ffmpegCommands.audio!.waitForFirstSegment();
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
