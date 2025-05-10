import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { BaseService } from 'src/services/base.service';
import { AssetType, ImmichWorker, Permission, TranscodeTarget, VideoCodec } from 'src/enum';
import { VideoInfo, VideoInterfaces } from 'src/types';
import { OnEvent } from 'src/decorators';
import { ArgOf } from 'src/repositories/event.repository';
import child_process from 'node:child_process';
import { sign } from 'jsonwebtoken';
import fs from 'node:fs/promises';
import { AuthDto } from 'src/dtos/auth.dto';
import { BaseConfig } from 'src/utils/media';
import {createWriteStream} from 'fs'

type VideoStream = VideoInfo['videoStreams'][0]
type AudioStream = VideoInfo['audioStreams'][0]


@Injectable()
export class TranscodingService extends BaseService {
  SUPPORTED_TAGS = ['avc1', 'hvc', 'dvh1'];
  AVC_PROFILES: { [key: string]: string } = { 'high': '.6400', 'main': '.4D40', 'baseline': '.42E0' };
  videoInterfaces: VideoInterfaces = { dri: [], mali: false };

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

  async getMasterPlaylist(id: string): Promise<string> {
    const playlist = [];

    const asset = await this.assetRepository.getById(id);
    if (!asset) {
      throw new NotFoundException('Asset not found');
    }

    const stats = await this.mediaRepository.probe(asset.originalPath);
    if (stats.videoStreams.length === 0) {
      throw new NotFoundException('No video streams in file');
    }

    const videoStream = stats.videoStreams[0],
      audioStream = (stats.audioStreams.length > 0) ? stats.audioStreams[0] : undefined;

    playlist.push(
      '#EXTM3U',
      '#EXT-X-VERSION:10',
      '#EXT-X-INDEPENDENT-SEGMENTS',

      `#EXT-X-STREAM-INF:BANDWIDTH=14358365,CODECS="avc1.64001e,mp4a.40.2",RESOLUTION=1920x1080,FRAME-RATE=30`,
      `1080p.m3u8`,
    );

    if (videoStream.codecTag && this.SUPPORTED_TAGS.includes(videoStream.codecTag)) {
      playlist.push(
        `#EXT-X-STREAM-INF:BANDWIDTH=${videoStream.bitrate},CODECS="${this.videoStreamToMime(videoStream)}${(audioStream ? (', ' + this.audioStreamToMime(audioStream)) : '')}",RESOLUTION=${videoStream.width}x${videoStream.height},FRAME-RATE=${videoStream.fps}`,
        `original.m3u8`,
      );
    }
    return playlist.join('\n');
  }

  async getPlaylist(id: string, quality: string, start: boolean): Promise<string> {
    const asset = await this.assetRepository.getById(id);
    if (!asset) {
      throw new NotFoundException('Asset not found');
    }

    const playlist = [];
    playlist.push(
      '#EXTM3U',
      '#EXT-X-VERSION:10',
      '#EXT-X-MEDIA-SEQUENCE:0',
      '#EXT-X-TARGETDURATION:10',
      '#EXT-X-PART-INF:PART-TARGET=0.5',
      '#EXT-X-PLAYLIST-TYPE:VOD',
      `#EXT-X-MAP:URI="${quality}/init.mp4"`,
    );

    const s = child_process.spawn('ffprobe', [
      '-loglevel', 'error', '-select_streams', 'v:0',
      '-show_entries', 'packet=pts_time,flags',
      '-of', 'csv=print_section=0', asset.originalPath,
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

      const time = Number.parseFloat(time_) * ((type.startsWith('K')) ? -1 : 1);
      frames.push(time);
    }
    if (frames.length === 0) {
      throw new NotFoundException('Video has no frames');
    }
    frames.sort((a, b) => Math.abs(a) - Math.abs(b));

    const partTimes: number[] = [];
    const keyTimes: number[] = [];
    let prevPart = frames[0], prevSeg = frames[0];
    let partIdx = 0;
    let prevPartIdx = 0;

    const original = quality == 'original';
    for (let i = 1; i < frames.length; i++) {
      const isKf = frames[i] <= 0;
      frames[i] = Math.abs(frames[i]);
      if (!original && (frames[i] - prevPart > 0.5 || isKf)) {
        partTimes.push(frames[i]);

        playlist.push(`#EXT-X-PART:DURATION=${(frames[i] - prevPart).toFixed(5)},URI="${quality}/${partIdx++}.mp4"${(prevPart === prevSeg) ? ',INDEPENDENT=YES' : ''}`);
        prevPart = frames[i];
      }

      if (isKf && frames[i] - prevSeg > 10) {
        if (original) {
          partTimes.push(frames[i]);
        }

        keyTimes.push(frames[i]);

        // TODO: If client decides to request full part, then we have to concat it using concat muxer
        playlist.push(
          `#EXTINF:${(frames[i] - prevSeg).toFixed(5)},`,
          `${quality}/${Array.from({ length: partIdx - prevPartIdx }, (_, i) => (prevPartIdx + i).toFixed(0)).join('.')}.mp4`,
        );
        prevPart = prevSeg = frames[i];
        prevPartIdx = partIdx;
      }
    }

    if (start) {
      this.eventRepository.serverSend('media.liveTranscode', {
        path: asset.originalPath,
        id,
        quality,
        partTimes,
        keyTimes,
        codec: VideoCodec.H264,
      });
    }

    return playlist.join('\n');
  }

  // From media.serivce.ts
  @OnEvent({ name: 'app.bootstrap' })
  async onBootstrap() {
    const [dri, mali] = await Promise.all([this.getDevices(), this.hasMaliOpenCL()]);
    this.videoInterfaces = { dri, mali };
  }

  @OnEvent({ name: 'media.liveTranscode', workers: [ImmichWorker.TRANSCODER], server: true })
  async liveTranscode({ path, id, quality, codec, partTimes, keyTimes }: ArgOf<'media.liveTranscode'>) {
    this.logger.debug(`Started transcoding video ${id}`);
    await fs.mkdir(`/tmp/video/${id}/`, { mode: 0o700, recursive: true });

    const { liveFfmpeg } = await this.getConfig({ withCache: true });
    liveFfmpeg.targetVideoCodec = codec;

    const stats = await this.mediaRepository.probe(path);
    if (stats.videoStreams.length === 0) {
      throw new NotFoundException('No video streams in file');
    }

    const args = [
      '-nostats', '-hide_banner', '-loglevel', 'warning',
      '-i', path];
    if (quality === 'original') {
      args.push('-vcodec', 'copy');
    } else {
      const videoStream = stats.videoStreams[0],
        audioStream = stats.audioStreams[0];

      const options = BaseConfig.create(liveFfmpeg, this.videoInterfaces).getCommand(TranscodeTarget.ALL, videoStream, audioStream);
      for (const option of options.inputOptions) {
        args.push(...option.split(' '))
      }
      for (const option of options.outputOptions) {
        args.push(...option.split(' '))
      }
      args.push(
        //'-vf', `scale=${quality}:-2`,
        '-maxrate', '4000k', '-bufsize', '1835k');
    }
    args.push(
      '-f', 'segment',
      '-segment_format', 'mp4',
      '-segment_list_type', 'csv',

      '-copyts', '-start_at_zero',
      '-muxdelay', '0',

      '-break_non_keyframes', '1',
      '-segment_times', partTimes.join(','),
      '-force_key_frames', keyTimes.join(','),
      '-segment_header_filename',
      `/tmp/video/${id}/init.mp4`,

      '-segment_format_options', 'movflags=dash+skip_sidx',

      '-segment_list', 'pipe:0',

      '-strict', '-2',
      `/tmp/video/${id}/%d.mp4`);
    const s = child_process.spawn('ffmpeg', args);

    s.stdout.on('data', (bytes) => {
      const data = bytes.toString('utf8');
      if (data) {
        this.logger.debug(`Segment ${data.split(',')[0]} ready`);
      }
    });
    var log = createWriteStream(`/tmp/video/${id}/transcoding.log`);
    s.stderr.pipe(log)
    s.on('exit', (code) => {
      if (code === 0) {
        this.logger.debug(`Finished live transcoding of video ${path}`);
      } else {
        this.logger.error(`Can't live transcode video ${path}`);
      }
      log.close();
    });
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

    return `/playback/${sign({ id, path: asset.originalPath }, secret)}/master.m3u8`;
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
