import { CQMode, ToneMapping, TranscodeHWAccel, VideoCodec } from '@app/infra/entities';
import {
  AudioStreamInfo,
  BitrateDistribution,
  TranscodeOptions,
  VideoCodecHWConfig,
  VideoCodecSWConfig,
  VideoStreamInfo,
} from '../repositories';
import { SystemConfigFFmpegDto } from '../system-config/dto';
class BaseConfig implements VideoCodecSWConfig {
  presets = ['veryslow', 'slower', 'slow', 'medium', 'fast', 'faster', 'veryfast', 'superfast', 'ultrafast'];
  constructor(protected config: SystemConfigFFmpegDto) {}

  getOptions(videoStream: VideoStreamInfo, audioStream?: AudioStreamInfo) {
    const options = {
      inputOptions: this.getBaseInputOptions(),
      outputOptions: [...this.getBaseOutputOptions(videoStream, audioStream), '-v verbose'],
      twoPass: this.eligibleForTwoPass(),
    } as TranscodeOptions;
    const filters = this.getFilterOptions(videoStream);
    if (filters.length > 0) {
      options.outputOptions.push(`-vf ${filters.join(',')}`);
    }
    options.outputOptions.push(...this.getPresetOptions(), ...this.getThreadOptions(), ...this.getBitrateOptions());

    return options;
  }

  getBaseInputOptions(): string[] {
    return [];
  }

  getBaseOutputOptions(videoStream: VideoStreamInfo, audioStream?: AudioStreamInfo) {
    const options = [
      `-c:v ${this.getVideoCodec()}`,
      `-c:a ${this.getAudioCodec()}`,
      // Makes a second pass moving the moov atom to the
      // beginning of the file for improved playback speed.
      '-movflags faststart',
      '-fps_mode passthrough',
      // explicitly selects the video stream instead of leaving it up to FFmpeg
      `-map 0:${videoStream.index}`,
    ];

    if (audioStream) {
      options.push(`-map 0:${audioStream.index}`);
    }
    if (this.getBFrames() > -1) {
      options.push(`-bf ${this.getBFrames()}`);
    }
    if (this.getRefs() > 0) {
      options.push(`-refs ${this.getRefs()}`);
    }
    if (this.getGopSize() > 0) {
      options.push(`-g ${this.getGopSize()}`);
    }

    if (this.config.targetVideoCodec === VideoCodec.HEVC) {
      options.push('-tag:v hvc1');
    }

    return options;
  }

  getFilterOptions(videoStream: VideoStreamInfo) {
    const options = [];
    if (this.shouldScale(videoStream)) {
      options.push(`scale=${this.getScaling(videoStream)}`);
    }

    if (this.shouldToneMap(videoStream)) {
      options.push(...this.getToneMapping());
    }
    options.push('format=yuv420p');

    return options;
  }

  getPresetOptions() {
    return [`-preset ${this.config.preset}`];
  }

  getBitrateOptions() {
    const bitrates = this.getBitrateDistribution();
    if (this.eligibleForTwoPass()) {
      return [
        `-b:v ${bitrates.target}${bitrates.unit}`,
        `-minrate ${bitrates.min}${bitrates.unit}`,
        `-maxrate ${bitrates.max}${bitrates.unit}`,
      ];
    } else if (bitrates.max > 0) {
      // -bufsize is the peak possible bitrate at any moment, while -maxrate is the max rolling average bitrate
      return [
        `-${this.useCQP() ? 'q:v' : 'crf'} ${this.config.crf}`,
        `-maxrate ${bitrates.max}${bitrates.unit}`,
        `-bufsize ${bitrates.max * 2}${bitrates.unit}`,
      ];
    } else {
      return [`-${this.useCQP() ? 'q:v' : 'crf'} ${this.config.crf}`];
    }
  }

  getThreadOptions(): Array<string> {
    if (this.config.threads <= 0) {
      return [];
    }
    return [`-threads ${this.config.threads}`];
  }

  eligibleForTwoPass() {
    if (!this.config.twoPass || this.config.accel !== TranscodeHWAccel.DISABLED) {
      return false;
    }

    return this.isBitrateConstrained() || this.config.targetVideoCodec === VideoCodec.VP9;
  }

  getBitrateDistribution() {
    const max = this.getMaxBitrateValue();
    const target = Math.ceil(max / 1.45); // recommended by https://developers.google.com/media/vp9/settings/vod
    const min = target / 2;
    const unit = this.getBitrateUnit();

    return { max, target, min, unit } as BitrateDistribution;
  }

  getTargetResolution(videoStream: VideoStreamInfo) {
    let target;
    target =
      this.config.targetResolution === 'original'
        ? Math.min(videoStream.height, videoStream.width)
        : Number.parseInt(this.config.targetResolution);

    if (target % 2 !== 0) {
      target -= 1;
    }

    return target;
  }

  shouldScale(videoStream: VideoStreamInfo) {
    const oddDimensions = videoStream.height % 2 !== 0 || videoStream.width % 2 !== 0;
    const largerThanTarget = Math.min(videoStream.height, videoStream.width) > this.getTargetResolution(videoStream);
    return oddDimensions || largerThanTarget;
  }

  shouldToneMap(videoStream: VideoStreamInfo) {
    return videoStream.isHDR && this.config.tonemap !== ToneMapping.DISABLED;
  }

  getScaling(videoStream: VideoStreamInfo) {
    const targetResolution = this.getTargetResolution(videoStream);
    const mult = this.config.accel === TranscodeHWAccel.QSV ? 1 : 2; // QSV doesn't support scaling numbers below -1
    return this.isVideoVertical(videoStream) ? `${targetResolution}:-${mult}` : `-${mult}:${targetResolution}`;
  }

  getSize(videoStream: VideoStreamInfo) {
    const smaller = this.getTargetResolution(videoStream);
    const factor = Math.max(videoStream.height, videoStream.width) / Math.min(videoStream.height, videoStream.width);
    let larger = Math.round(smaller * factor);
    if (larger % 2 !== 0) {
      larger -= 1;
    }
    return this.isVideoVertical(videoStream) ? { width: smaller, height: larger } : { width: larger, height: smaller };
  }

  isVideoRotated(videoStream: VideoStreamInfo) {
    return Math.abs(videoStream.rotation) === 90;
  }

  isVideoVertical(videoStream: VideoStreamInfo) {
    return videoStream.height > videoStream.width || this.isVideoRotated(videoStream);
  }

  isBitrateConstrained() {
    return this.getMaxBitrateValue() > 0;
  }

  getBitrateUnit() {
    const maxBitrate = this.getMaxBitrateValue();
    return this.config.maxBitrate.trim().slice(maxBitrate.toString().length); // use inputted unit if provided
  }

  getMaxBitrateValue() {
    return Number.parseInt(this.config.maxBitrate) || 0;
  }

  getPresetIndex() {
    return this.presets.indexOf(this.config.preset);
  }

  getColors() {
    return {
      primaries: 'bt709',
      transfer: 'bt709',
      matrix: 'bt709',
    };
  }

  getNPL() {
    if (this.config.npl <= 0) {
      // since hable already outputs a darker image, we use a lower npl value for it
      return this.config.tonemap === ToneMapping.HABLE ? 100 : 250;
    } else {
      return this.config.npl;
    }
  }

  getToneMapping() {
    const colors = this.getColors();

    return [
      `zscale=t=linear:npl=${this.getNPL()}`,
      `tonemap=${this.config.tonemap}:desat=0`,
      `zscale=p=${colors.primaries}:t=${colors.transfer}:m=${colors.matrix}:range=pc`,
    ];
  }

  getAudioCodec(): string {
    return this.config.targetAudioCodec;
  }

  getVideoCodec(): string {
    return this.config.targetVideoCodec;
  }

  getBFrames() {
    return this.config.bframes;
  }

  getRefs() {
    return this.config.refs;
  }

  getGopSize() {
    return this.config.gopSize;
  }

  useCQP() {
    return this.config.cqMode === CQMode.CQP;
  }
}

export class BaseHWConfig extends BaseConfig implements VideoCodecHWConfig {
  protected devices: string[];

  constructor(
    protected config: SystemConfigFFmpegDto,
    devices: string[] = [],
  ) {
    super(config);
    this.devices = this.validateDevices(devices);
  }

  getSupportedCodecs() {
    return [VideoCodec.H264, VideoCodec.HEVC, VideoCodec.VP9];
  }

  validateDevices(devices: string[]) {
    return devices
      .filter((device) => device.startsWith('renderD') || device.startsWith('card'))
      .sort((a, b) => {
        // order GPU devices first
        if (a.startsWith('card') && b.startsWith('renderD')) {
          return -1;
        }
        if (a.startsWith('renderD') && b.startsWith('card')) {
          return 1;
        }
        return -a.localeCompare(b);
      });
  }

  getVideoCodec(): string {
    return `${this.config.targetVideoCodec}_${this.config.accel}`;
  }

  getGopSize() {
    if (this.config.gopSize <= 0) {
      return 256;
    }
    return this.config.gopSize;
  }

  getPreferredHardwareDevice(): string | null {
    const device = this.config.preferredHwDevice;
    if (device === 'auto') {
      return null;
    }

    const deviceName = device.replace('/dev/dri/', '');
    if (!this.devices.includes(deviceName)) {
      throw new Error(`Device '${device}' does not exist`);
    }

    return device;
  }
}

export class ThumbnailConfig extends BaseConfig {
  getBaseInputOptions(): string[] {
    return ['-ss 00:00:00', '-sws_flags accurate_rnd+bitexact+full_chroma_int'];
  }
  getBaseOutputOptions() {
    return ['-frames:v 1'];
  }

  getPresetOptions() {
    return [];
  }

  getBitrateOptions() {
    return [];
  }

  eligibleForTwoPass() {
    return false;
  }

  getScaling(videoStream: VideoStreamInfo) {
    let options = super.getScaling(videoStream);
    options += ':flags=lanczos+accurate_rnd+bitexact+full_chroma_int';
    if (!this.shouldToneMap(videoStream)) {
      options += ':out_color_matrix=601:out_range=pc';
    }
    return options;
  }

  getColors() {
    return {
      primaries: 'bt709',
      transfer: '601',
      matrix: 'bt470bg',
    };
  }
}

export class H264Config extends BaseConfig {
  getThreadOptions() {
    if (this.config.threads <= 0) {
      return [];
    }
    return [
      ...super.getThreadOptions(),
      '-x264-params "pools=none"',
      `-x264-params "frame-threads=${this.config.threads}"`,
    ];
  }
}

export class HEVCConfig extends BaseConfig {
  getThreadOptions() {
    if (this.config.threads <= 0) {
      return [];
    }
    return [
      ...super.getThreadOptions(),
      '-x265-params "pools=none"',
      `-x265-params "frame-threads=${this.config.threads}"`,
    ];
  }
}

export class VP9Config extends BaseConfig {
  getPresetOptions() {
    const speed = Math.min(this.getPresetIndex(), 5); // values over 5 require realtime mode, which is its own can of worms since it overrides -crf and -threads
    if (speed >= 0) {
      return [`-cpu-used ${speed}`];
    }
    return [];
  }

  getBitrateOptions() {
    const bitrates = this.getBitrateDistribution();
    if (bitrates.max > 0 && this.eligibleForTwoPass()) {
      return [
        `-b:v ${bitrates.target}${bitrates.unit}`,
        `-minrate ${bitrates.min}${bitrates.unit}`,
        `-maxrate ${bitrates.max}${bitrates.unit}`,
      ];
    }

    return [`-${this.useCQP() ? 'q:v' : 'crf'} ${this.config.crf}`, `-b:v ${bitrates.max}${bitrates.unit}`];
  }

  getThreadOptions() {
    return ['-row-mt 1', ...super.getThreadOptions()];
  }
}

export class NVENCConfig extends BaseHWConfig {
  getSupportedCodecs() {
    return [VideoCodec.H264, VideoCodec.HEVC];
  }

  getBaseInputOptions() {
    return ['-init_hw_device cuda=cuda:0', '-filter_hw_device cuda'];
  }

  getBaseOutputOptions(videoStream: VideoStreamInfo, audioStream?: AudioStreamInfo) {
    const options = [
      // below settings recommended from https://docs.nvidia.com/video-technologies/video-codec-sdk/12.0/ffmpeg-with-nvidia-gpu/index.html#command-line-for-latency-tolerant-high-quality-transcoding
      '-tune hq',
      '-qmin 0',
      '-rc-lookahead 20',
      '-i_qfactor 0.75',
      ...super.getBaseOutputOptions(videoStream, audioStream),
    ];
    if (this.getBFrames() > 0) {
      options.push('-b_ref_mode middle', '-b_qfactor 1.1');
    }
    if (this.config.temporalAQ) {
      options.push('-temporal-aq 1');
    }
    return options;
  }

  getFilterOptions(videoStream: VideoStreamInfo) {
    const options = this.shouldToneMap(videoStream) ? this.getToneMapping() : [];
    options.push('format=nv12', 'hwupload_cuda');
    if (this.shouldScale(videoStream)) {
      options.push(`scale_cuda=${this.getScaling(videoStream)}`);
    }

    return options;
  }

  getPresetOptions() {
    let presetIndex = this.getPresetIndex();
    if (presetIndex < 0) {
      return [];
    }
    presetIndex = 7 - Math.min(6, presetIndex); // map to p1-p7; p7 is the highest quality, so reverse index
    return [`-preset p${presetIndex}`];
  }

  getBitrateOptions() {
    const bitrates = this.getBitrateDistribution();
    if (bitrates.max > 0 && this.config.twoPass) {
      return [
        `-b:v ${bitrates.target}${bitrates.unit}`,
        `-maxrate ${bitrates.max}${bitrates.unit}`,
        `-bufsize ${bitrates.target}${bitrates.unit}`,
        '-multipass 2',
      ];
    } else if (bitrates.max > 0) {
      return [
        `-cq:v ${this.config.crf}`,
        `-maxrate ${bitrates.max}${bitrates.unit}`,
        `-bufsize ${bitrates.target}${bitrates.unit}`,
      ];
    } else {
      return [`-cq:v ${this.config.crf}`];
    }
  }

  getThreadOptions() {
    return [];
  }

  getRefs() {
    const bframes = this.getBFrames();
    if (bframes > 0 && bframes < 3 && this.config.refs < 3) {
      return 0;
    }
    return this.config.refs;
  }
}

export class QSVConfig extends BaseHWConfig {
  getBaseInputOptions() {
    if (this.devices.length === 0) {
      throw new Error('No QSV device found');
    }

    let qsvString = '';
    const hwDevice = this.getPreferredHardwareDevice();
    if (hwDevice !== null) {
      qsvString = `,child_device=${hwDevice}`;
    }

    return [`-init_hw_device qsv=hw${qsvString}`, '-filter_hw_device hw'];
  }

  getBaseOutputOptions(videoStream: VideoStreamInfo, audioStream?: AudioStreamInfo) {
    const options = super.getBaseOutputOptions(videoStream, audioStream);
    // VP9 requires enabling low power mode https://git.ffmpeg.org/gitweb/ffmpeg.git/commit/33583803e107b6d532def0f9d949364b01b6ad5a
    if (this.config.targetVideoCodec === VideoCodec.VP9) {
      options.push('-low_power 1');
    }
    return options;
  }

  getFilterOptions(videoStream: VideoStreamInfo) {
    const options = this.shouldToneMap(videoStream) ? this.getToneMapping() : [];
    options.push('format=nv12', 'hwupload=extra_hw_frames=64');
    if (this.shouldScale(videoStream)) {
      options.push(`scale_qsv=${this.getScaling(videoStream)}`);
    }
    return options;
  }

  getPresetOptions() {
    let presetIndex = this.getPresetIndex();
    if (presetIndex < 0) {
      return [];
    }
    presetIndex = Math.min(6, presetIndex) + 1; // 1 to 7
    return [`-preset ${presetIndex}`];
  }

  getBitrateOptions() {
    const options = [];
    options.push(`-${this.useCQP() ? 'q:v' : 'global_quality'} ${this.config.crf}`);
    const bitrates = this.getBitrateDistribution();
    if (bitrates.max > 0) {
      options.push(`-maxrate ${bitrates.max}${bitrates.unit}`, `-bufsize ${bitrates.max * 2}${bitrates.unit}`);
    }
    return options;
  }

  // recommended from https://github.com/intel/media-delivery/blob/master/doc/benchmarks/intel-iris-xe-max-graphics/intel-iris-xe-max-graphics.md
  getBFrames() {
    if (this.config.bframes < 0) {
      return 7;
    }
    return this.config.bframes;
  }

  getRefs() {
    if (this.config.refs <= 0) {
      return 5;
    }
    return this.config.refs;
  }

  useCQP() {
    return this.config.cqMode === CQMode.CQP || this.config.targetVideoCodec === VideoCodec.VP9;
  }
}

export class VAAPIConfig extends BaseHWConfig {
  getBaseInputOptions() {
    if (this.devices.length === 0) {
      throw new Error('No VAAPI device found');
    }

    let hwDevice = this.getPreferredHardwareDevice();
    if (hwDevice === null) {
      hwDevice = `/dev/dri/${this.devices[0]}`;
    }

    return [`-init_hw_device vaapi=accel:${hwDevice}`, '-filter_hw_device accel'];
  }

  getFilterOptions(videoStream: VideoStreamInfo) {
    const options = this.shouldToneMap(videoStream) ? this.getToneMapping() : [];
    options.push('format=nv12', 'hwupload');
    if (this.shouldScale(videoStream)) {
      options.push(`scale_vaapi=${this.getScaling(videoStream)}`);
    }

    return options;
  }

  getPresetOptions() {
    let presetIndex = this.getPresetIndex();
    if (presetIndex < 0) {
      return [];
    }
    presetIndex = Math.min(6, presetIndex) + 1; // 1 to 7
    return [`-compression_level ${presetIndex}`];
  }

  getBitrateOptions() {
    const bitrates = this.getBitrateDistribution();
    const options = [];

    if (this.config.targetVideoCodec === VideoCodec.VP9) {
      options.push('-bsf:v vp9_raw_reorder,vp9_superframe');
    }

    // VAAPI doesn't allow setting both quality and max bitrate
    if (bitrates.max > 0) {
      options.push(
        `-b:v ${bitrates.target}${bitrates.unit}`,
        `-maxrate ${bitrates.max}${bitrates.unit}`,
        `-minrate ${bitrates.min}${bitrates.unit}`,
        '-rc_mode 3',
      ); // variable bitrate
    } else if (this.useCQP()) {
      options.push(`-qp ${this.config.crf}`, `-global_quality ${this.config.crf}`, '-rc_mode 1');
    } else {
      options.push(`-global_quality ${this.config.crf}`, '-rc_mode 4');
    }

    return options;
  }

  useCQP() {
    return this.config.cqMode !== CQMode.ICQ || this.config.targetVideoCodec === VideoCodec.VP9;
  }
}

export class RKMPPConfig extends BaseHWConfig {
  getOptions(videoStream: VideoStreamInfo, audioStream?: AudioStreamInfo): TranscodeOptions {
    const options = super.getOptions(videoStream, audioStream);
    options.ffmpegPath = 'ffmpeg_mpp';
    options.ldLibraryPath = '/lib/aarch64-linux-gnu:/lib/ffmpeg-mpp';
    options.outputOptions.push(...this.getSizeOptions(videoStream));
    return options;
  }

  eligibleForTwoPass(): boolean {
    return false;
  }

  getBaseInputOptions() {
    if (this.devices.length === 0) {
      throw new Error('No RKMPP device found');
    }
    return [];
  }

  getFilterOptions(videoStream: VideoStreamInfo) {
    return this.shouldToneMap(videoStream) ? this.getToneMapping() : [];
  }

  getSizeOptions(videoStream: VideoStreamInfo) {
    if (this.shouldScale(videoStream)) {
      const { width, height } = this.getSize(videoStream);
      return [`-width ${width}`, `-height ${height}`];
    }
    return [];
  }

  getPresetOptions() {
    switch (this.config.targetVideoCodec) {
      case VideoCodec.H264: {
        // from ffmpeg_mpp help, commonly referred to as H264 level 5.1
        return ['-level 51'];
      }
      case VideoCodec.HEVC: {
        // from ffmpeg_mpp help, commonly referred to as HEVC level 5.1
        return ['-level 153'];
      }
      default: {
        throw new Error(`Incompatible video codec for RKMPP: ${this.config.targetVideoCodec}`);
      }
    }
  }

  getBitrateOptions() {
    const bitrate = this.getMaxBitrateValue();
    if (bitrate > 0) {
      return ['-rc_mode 3', '-quality_min 0', '-quality_max 100', `-b:v ${bitrate}${this.getBitrateUnit()}`];
    } else {
      // convert CQP from 51-10 to 0-100, values below 10 are set to 10
      const quality = Math.floor(125 - Math.max(this.config.crf, 10) * (125 / 51));
      return ['-rc_mode 2', `-quality_min ${quality}`, `-quality_max ${quality}`];
    }
  }

  getSupportedCodecs() {
    return [VideoCodec.H264, VideoCodec.HEVC];
  }

  getVideoCodec(): string {
    return `${this.config.targetVideoCodec}_rkmpp_encoder`;
  }
}
