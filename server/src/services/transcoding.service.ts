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
import { AudioStreamInfo, VideoInfo, VideoInterfaces, VideoStreamInfo } from 'src/types';
import { BaseConfig } from 'src/utils/media';

const ROOT_DIR = `/tmp/video`;
class FFmpegInstance {
  private readonly SEGMENT_TROTTLING_COUNT = 24;
  private readonly SEGMENT_TROTTLING_RESUME = 12;
  private firstSegmentDone?: PromiseWithResolvers<void>;
  private ffmpegTerminated?: PromiseWithResolvers<void>;
  private ffmpegCommand?: ChildProcessWithoutNullStreams;
  private offset_: number;
  private segment_: number = 0;
  private current: number;
  args: string[];
  logger: LoggingRepository;
  sessionId: string;
  inputPath: string;
  logPath: string;

  constructor(
    args: string[],
    logger: LoggingRepository,
    sessionId: string,
    inputPath: string,
    logPath: string,
    offset: number,
  ) {
    this.args = args;
    this.logger = logger;
    this.sessionId = sessionId;
    this.inputPath = inputPath;
    this.logPath = logPath;
    this.offset_ = offset;
    this.current = offset;
  }

  seek(current: number) {
    this.current = current;
    if (this.current - this.segment_ > this.SEGMENT_TROTTLING_RESUME) {
      this.resume();
    }
  }

  get segment(): number {
    return this.segment_;
  }
  get offset(): number {
    return this.offset_;
  }

  waitForSegment() {
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
          const idx = parseInt(name.split('.')[0]);

          if (idx == this.offset_) {
            this.firstSegmentDone?.resolve();
          }
          if (idx - this.current > this.SEGMENT_TROTTLING_COUNT) {
            this.pause();
          }
          this.segment_ = idx + 1;
          this.logger.debug(`Segment ${idx} ready, session: ${this.sessionId}`);
        }
      }
    });
    const log = createWriteStream(this.logPath);
    log.write('ffmpeg ');
    log.write(this.args.join(' '));
    log.write('\n');
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

  pause() {
    this.ffmpegCommand?.kill('SIGSTOP');
  }

  resume() {
    this.ffmpegCommand?.kill('SIGCONT');
  }
}

class PartManager {
  private ready: Set<number> = new Set();

  clean(current: number, id: string, quality: string) {
    const last = current - HLSConnection.segmentGapRequiringTranscodingChange;
    const set = this.ready;
    this.ready = new Set(
      (function* () {
        for (const element of set) {
          if (element >= last) {
            yield element;
          } else {
            fs.unlink(`${ROOT_DIR}/${id}/${quality}/${element}.mp4`);
          }
        }
      })(),
    );
  }

  async delete(id: string, quality: string) {
    fs.rmdir(`${ROOT_DIR}/${id}/${quality}/`);
    this.ready.clear();
  }
}

// There is actually no persistent "connection"
class HLSConnection {
  public static readonly SEGMENT_TARGET_TIME = 2;
  // 24s taken from Jellyfin
  public static readonly segmentGapRequiringTranscodingChange = 24 / this.SEGMENT_TARGET_TIME;

  ffmpegCommands: { video?: FFmpegInstance; audio?: FFmpegInstance } = {};

  private partTimes: number[] = [];
  private partFrames: number[] = [];

  private videoInterfaces: VideoInterfaces;

  private vQuality?: string;
  private aQuality?: string;
  private requestedSegment = 0;

  private inputPath: string;
  private id: string;

  private stats: VideoInfo;

  // Doubtful but okay
  private logger: LoggingRepository;
  private liveFfmpegConfig: SystemConfigFFmpegDto;

  private sessionId: string;

  private parts: PartManager;
  private frames?: number[];
  private gopSize: number;

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
    this.gopSize = Math.ceil(stats.videoStreams[0]!.fps * HLSConnection.SEGMENT_TARGET_TIME);
    this.liveFfmpegConfig.gopSize = this.gopSize;

    this.inputPath = asset.originalPath;
    this.id = asset.id;
    this.stats = stats;
    this.videoInterfaces = videoInterfaces;

    this.parts = new PartManager();
  }

  async seek(idx: number) {
    this.requestedSegment = idx;
    try {
      await fs.access(
        `${ROOT_DIR}/${this.sessionId}/${this.videoCodec}/${this.vQuality}}/${idx}.mp4`,
        fs.constants.F_OK,
      );
      return;
    } catch {
      if (
        this.ffmpegCommands.video != undefined &&
        (idx < (this.ffmpegCommands.video?.offset ?? 0) ||
          idx - (this.ffmpegCommands.video?.segment ?? this.ffmpegCommands.video?.offset) >
            HLSConnection.segmentGapRequiringTranscodingChange)
      ) {
        this.ffmpegCommands.video?.kill();
        this.ffmpegCommands.video = undefined as FFmpegInstance | undefined;
        await this.startTranscodingVideo();
        await this.ffmpegCommands.video?.waitForSegment();
      }
    }
  }

  async probe() {
    if (this.frames) {
      return;
    }
    this.frames = [];
    // prettier-ignore
    const s = child_process.spawn('ffprobe', [
      '-loglevel', 'error',
      '-select_streams', 'v:0',
      '-show_entries', 'packet=pts_time,flags',
      '-of', 'csv=print_section=0',
      this.inputPath,
    ]);

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
      this.frames.push(time);
    }
    if (this.frames.length === 0) {
      throw new NotFoundException('Video has no frames');
    }
    this.frames.sort((a, b) => Math.abs(a) - Math.abs(b));
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
    await fs.mkdir(`${ROOT_DIR}/${this.sessionId}/${this.videoCodec}/${this.videoQuality}`, {
      mode: 0o700,
      recursive: true,
    });

    const videoStream = this.stats.videoStreams[0];
    // prettier-ignore
    const args = ['-nostats', '-hide_banner', '-loglevel', 'warning',
      '-ss', this.partTimes[this.requestedSegment].toString(),
      '-noaccurate_seek'
    ];
    if (this.videoQuality === 'original') {
      // prettier-ignore
      args.push(
        '-i', this.inputPath,
        
        '-c:v', 'copy',
        '-start_at_zero',
        '-copyts',
        '-muxdelay', '0',
      );
    } else {
      this.liveFfmpegConfig.gopSize = this.gopSize;
      const options = BaseConfig.create(this.liveFfmpegConfig, this.videoInterfaces).getCommand(
        TranscodeTarget.Video,
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
      '-segment_start_number', this.requestedSegment.toString(),

      '-segment_frames', this.partFrames!.join(',')
    );

    /*if (this.videoQuality !== 'original') {
      args.push('-force_key_frames', this.keyTimes!.join(','));
    }*/

    // prettier-ignore
    args.push(
      '-segment_header_filename', `${ROOT_DIR}/${this.sessionId}/${this.videoCodec}/${this.videoQuality}/init.mp4`,
      '-segment_format_options', 'movflags=dash+skip_sidx',
      '-segment_list', 'pipe:1',

      '-strict', '-2',
      `${ROOT_DIR}/${this.sessionId}/${this.videoCodec}/${this.videoQuality}/%d.mp4`,
    );

    const instance = new FFmpegInstance(
      args,
      this.logger,
      this.sessionId,
      this.inputPath,
      `${ROOT_DIR}/${this.sessionId}/${this.videoCodec}/${this.videoQuality}/transcoding.log`,
      this.requestedSegment,
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
      `Started transcoding audio ${this.inputPath}, requested ${this.audioCodec}:${this.aQuality}, session ${this.sessionId}`,
    );
    await fs.mkdir(`${ROOT_DIR}/${this.sessionId}/${this.audioCodec}/${this.audioQuality}`, {
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

      '-segment_times', this.partTimes!.join(','),

      '-segment_header_filename',
      `${ROOT_DIR}/${this.sessionId}/${this.audioCodec}/${this.audioQuality}/init.mp4`,

      '-segment_format_options', 'movflags=dash+skip_sidx',
      '-segment_list', 'pipe:1',

      `${ROOT_DIR}/${this.sessionId}/${this.audioCodec}/${this.audioQuality}/%d.mp4`,
    );

    const instance = new FFmpegInstance(
      args,
      this.logger,
      this.sessionId,
      this.inputPath,
      `${ROOT_DIR}/${this.sessionId}/${this.videoCodec}/${this.videoQuality}/transcoding.log`,
      this.requestedSegment,
    );
    instance.run();
    this.ffmpegCommands.audio = instance;
  }

  async getVideoPlaylist() {
    await this.probe();
    if (!this.frames) {
      throw new NotFoundException(`Video ${this.id} has no frames`);
    }
    this.partTimes = [];
    const videoPlaylist = [
      '#EXTM3U',
      '#EXT-X-VERSION:7',
      '#EXT-X-MEDIA-SEQUENCE:0',
      '#EXT-X-TARGETDURATION:2',
      '#EXT-X-PLAYLIST-TYPE:VOD',
      `#EXT-X-MAP:URI="init.mp4"`,
    ];

    let l = 0;
    let r = 1;
    let partIdx = 0;

    if (this.videoQuality === 'original') {
      while (r < this.frames.length - 1) {
        const isKf = this.frames[r] <= 0;
        const frame = Math.abs(this.frames[r]);
        const prevFrame = Math.abs(this.frames[l]);

        if (isKf) {
          this.partTimes.push(frame);
          this.partFrames.push(r + 1);
          videoPlaylist.push(`#EXTINF:${(Math.abs(this.frames[r + 1]) - prevFrame).toFixed(5)}`, `${partIdx++}.mp4`);
          l = r;
        }
        r++;
      }
    } else {
      while (r < this.frames.length - 1) {
        const isKf = this.frames[r] <= 0;
        const frame = Math.abs(this.frames[r]);
        const prevFrame = Math.abs(this.frames[l]);

        if (r - l >= this.gopSize) {
          videoPlaylist.push(`#EXTINF:${(Math.abs(this.frames[r + 1]) - prevFrame).toFixed(5)}`, `${partIdx++}.mp4`);
          this.partTimes.push(frame);
          this.partFrames.push(r);
          l = r;
        }
        r++;
      }
    }
    videoPlaylist.push(
      `#EXTINF:${(Math.abs(this.frames[this.frames.length - 1]) - Math.abs(this.frames[l])).toFixed(5)}`,
      `${partIdx++}.mp4`,
      '#EXT-X-ENDLIST',
    );

    return videoPlaylist.join('\n');
  }

  async getAudioPlaylist() {
    await this.probe();
    if (!this.frames) {
      throw new NotFoundException(`Video ${this.id} has no frames`);
    }
    const audioPlaylist = [];
    let audioSegIdx = 0;
    let i = this.gopSize;
    for (; i < this.frames.length - 1; i += this.gopSize) {
      audioPlaylist.push(
        `#EXTINF:${(this.frames[i] - this.frames[i - this.gopSize]).toFixed(5)}`,
        `${audioSegIdx++}.mp4`,
      );
    }
    audioPlaylist.push(
      `#EXTINF:${(this.frames[this.frames.length - 1] - this.frames[i - this.gopSize]).toFixed(5)}`,
      `${audioSegIdx++}.mp4`,
    );
    return audioPlaylist.join('\n');
  }
}

@Injectable()
export class TranscodingService extends BaseService {
  SUPPORTED_TAGS = ['avc1', 'hvc', 'dvh1'];
  AVC_PROFILES: { [key: string]: string } = { high: '.6400', main: '.4D40', baseline: '.42E0' };
  videoInterfaces: VideoInterfaces = { dri: [], mali: false };

  connections: Map<string, HLSConnection> = new Map();

  // https://github.com/zoriya/Kyoo/blob/d08febf803e307da1277996f7856bd901b6e83e2/transcoder/src/codec.go#L18
  private videoStreamToMime(stream: VideoStreamInfo): string {
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

  async seek(id: string, sessionId: string, codec: string, quality: string, segment: number) {
    const connection = this.connections.get(sessionId);
    if (!connection) {
      throw new BadRequestException('Not connected');
    }
    if ((<any>Object).values(VideoCodec).includes(codec)) {
      if (connection.videoCodec !== codec) {
        throw new BadRequestException(`Client ${sessionId} hasn\'t yet switched to ${quality} quality`);
      }
    } else if ((<any>Object).values(AudioCodec).includes(codec)) {
      if (connection.audioCodec !== codec) {
        throw new BadRequestException(`Client ${sessionId} hasn\'t yet switched to ${quality} quality`);
      }
    } else {
      throw new Error('Invalid codec');
    }

    await connection.seek(segment);
  }

  private audioStreamToMime(stream: AudioStreamInfo) {
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
    const connection = new HLSConnection(
      this.logger,
      sessionId,
      config.ffmpeg.live,
      asset,
      this.videoInterfaces,
      stats,
    );

    this.connections.set(sessionId, connection);

    const videoStream = stats.videoStreams[0];
    const audioStream = stats.audioStreams.length > 0 ? stats.audioStreams[0] : undefined;

    playlist.push(
      '#EXTM3U',
      '#EXT-X-VERSION:7',
      '#EXT-X-INDEPENDENT-SEGMENTS',

      //`#EXT-X-STREAM-INF:BANDWIDTH=56320,CODECS="mp4a.40.5"`,
      //`a/aac/55/playlist.m3u8`,

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
    const playlist = await connection.getVideoPlaylist();
    await connection.updateVideoStream(codec, quality);

    await connection.ffmpegCommands.video!.waitForSegment();
    return playlist;
  }

  async getAudioPlaylist(id: string, sessionId: string, codec: AudioCodec, quality: string): Promise<string> {
    const connection = this.connections.get(sessionId);
    if (!connection) {
      throw new BadRequestException('Not connected');
    }
    await connection.updateAudioStream(codec, quality);

    await connection.ffmpegCommands.audio!.waitForSegment();
    return connection.getAudioPlaylist();
  }

  // From media.serivce.ts
  @OnEvent({ name: 'AppBootstrap' })
  async onBootstrap() {
    const [dri, mali] = await Promise.all([this.getDevices(), this.hasMaliOpenCL()]);
    this.videoInterfaces = { dri, mali };
  }

  async getPlaylistUrl(auth: AuthDto, id: string): Promise<string> {
    await this.requireAccess({ auth, permission: Permission.AssetView, ids: [id] });

    const asset = await this.assetRepository.getById(id);
    if (!asset) {
      throw new NotFoundException('Asset not found');
    }
    if (asset.type !== AssetType.Video) {
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
