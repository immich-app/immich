import { TranscodeHWAccel, VideoCodec } from '@app/infra/entities';
import { SystemConfigFFmpegDto } from '../system-config/dto';
import {
  BitrateDistribution,
  TranscodeOptions,
  VideoCodecHWConfig,
  VideoCodecSWConfig,
  VideoStreamInfo,
} from './media.repository';
class BaseConfig implements VideoCodecSWConfig {
  constructor(protected config: SystemConfigFFmpegDto) {}

  getOptions(stream: VideoStreamInfo) {
    const options = {
      inputOptions: this.getBaseInputOptions(),
      outputOptions: this.getBaseOutputOptions().concat([
        `-acodec ${this.config.targetAudioCodec}`,
        // Makes a second pass moving the moov atom to the
        // beginning of the file for improved playback speed.
        '-movflags faststart',
        '-fps_mode passthrough',
        '-v verbose',
      ]),
      twoPass: this.eligibleForTwoPass(),
    } as TranscodeOptions;
    const filters = this.getFilterOptions(stream);
    if (filters.length > 0) {
      options.outputOptions.push(`-vf ${filters.join(',')}`);
    }
    options.outputOptions.push(...this.getPresetOptions());
    options.outputOptions.push(...this.getThreadOptions());
    options.outputOptions.push(...this.getBitrateOptions());

    return options;
  }

  getBaseInputOptions(): string[] {
    return [];
  }

  getBaseOutputOptions() {
    return [`-vcodec ${this.config.targetVideoCodec}`];
  }

  getFilterOptions(stream: VideoStreamInfo) {
    const options = [];
    if (this.shouldScale(stream)) {
      options.push(`scale=${this.getScaling(stream)}`);
    }

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
        `-crf ${this.config.crf}`,
        `-maxrate ${bitrates.max}${bitrates.unit}`,
        `-bufsize ${bitrates.max * 2}${bitrates.unit}`,
      ];
    } else {
      return [`-crf ${this.config.crf}`];
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

  getTargetResolution(stream: VideoStreamInfo) {
    if (this.config.targetResolution === 'original') {
      return Math.min(stream.height, stream.width);
    }

    return Number.parseInt(this.config.targetResolution);
  }

  shouldScale(stream: VideoStreamInfo) {
    return Math.min(stream.height, stream.width) > this.getTargetResolution(stream);
  }

  getScaling(stream: VideoStreamInfo) {
    const targetResolution = this.getTargetResolution(stream);
    const mult = this.config.accel === TranscodeHWAccel.QSV ? 1 : 2; // QSV doesn't support scaling numbers below -1
    return this.isVideoVertical(stream) ? `${targetResolution}:-${mult}` : `-${mult}:${targetResolution}`;
  }

  isVideoRotated(stream: VideoStreamInfo) {
    return Math.abs(stream.rotation) === 90;
  }

  isVideoVertical(stream: VideoStreamInfo) {
    return stream.height > stream.width || this.isVideoRotated(stream);
  }

  isBitrateConstrained() {
    return this.getMaxBitrateValue() > 0;
  }

  getBitrateUnit() {
    const maxBitrate = this.getMaxBitrateValue();
    return this.config.maxBitrate.trim().substring(maxBitrate.toString().length); // use inputted unit if provided
  }

  getMaxBitrateValue() {
    return Number.parseInt(this.config.maxBitrate) || 0;
  }

  getPresetIndex() {
    const presets = ['veryslow', 'slower', 'slow', 'medium', 'fast', 'faster', 'veryfast', 'superfast', 'ultrafast'];
    return presets.indexOf(this.config.preset);
  }
}

export class BaseHWConfig extends BaseConfig implements VideoCodecHWConfig {
  protected devices: string[];

  constructor(protected config: SystemConfigFFmpegDto, devices: string[] = []) {
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
    if (this.eligibleForTwoPass()) {
      return [
        `-b:v ${bitrates.target}${bitrates.unit}`,
        `-minrate ${bitrates.min}${bitrates.unit}`,
        `-maxrate ${bitrates.max}${bitrates.unit}`,
      ];
    }

    return [`-crf ${this.config.crf}`, `-b:v ${bitrates.max}${bitrates.unit}`];
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

  getBaseOutputOptions() {
    return [
      `-vcodec ${this.config.targetVideoCodec}_nvenc`,
      // below settings recommended from https://docs.nvidia.com/video-technologies/video-codec-sdk/12.0/ffmpeg-with-nvidia-gpu/index.html#command-line-for-latency-tolerant-high-quality-transcoding
      '-tune hq',
      '-qmin 0',
      '-g 250',
      '-bf 3',
      '-b_ref_mode middle',
      '-temporal-aq 1',
      '-rc-lookahead 20',
      '-i_qfactor 0.75',
      '-b_qfactor 1.1',
    ];
  }

  getFilterOptions(stream: VideoStreamInfo) {
    const options = ['hwupload_cuda'];
    if (this.shouldScale(stream)) {
      options.push(`scale_cuda=${this.getScaling(stream)}`);
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
}

export class QSVConfig extends BaseHWConfig {
  getBaseInputOptions() {
    if (!this.devices.length) {
      throw Error('No QSV device found');
    }
    return ['-init_hw_device qsv=hw', '-filter_hw_device hw'];
  }

  getBaseOutputOptions() {
    // recommended from https://github.com/intel/media-delivery/blob/master/doc/benchmarks/intel-iris-xe-max-graphics/intel-iris-xe-max-graphics.md
    const options = [`-vcodec ${this.config.targetVideoCodec}_qsv`, '-g 256', '-extbrc 1', '-refs 5', '-bf 7'];
    // VP9 requires enabling low power mode https://git.ffmpeg.org/gitweb/ffmpeg.git/commit/33583803e107b6d532def0f9d949364b01b6ad5a
    if (this.config.targetVideoCodec === VideoCodec.VP9) {
      options.push('-low_power 1');
    }
    return options;
  }

  getFilterOptions(stream: VideoStreamInfo) {
    const options = ['format=nv12', 'hwupload=extra_hw_frames=64'];
    if (this.shouldScale(stream)) {
      options.push(`scale_qsv=${this.getScaling(stream)}`);
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
    if (this.config.targetVideoCodec !== VideoCodec.VP9) {
      options.push(`-global_quality ${this.config.crf}`);
    } else {
      options.push(`-q:v ${this.config.crf}`);
    }
    const bitrates = this.getBitrateDistribution();
    if (bitrates.max > 0) {
      options.push(`-maxrate ${bitrates.max}${bitrates.unit}`);
      options.push(`-bufsize ${bitrates.max * 2}${bitrates.unit}`);
    }
    return options;
  }
}

export class VAAPIConfig extends BaseHWConfig {
  getBaseInputOptions() {
    if (this.devices.length === 0) {
      throw Error('No VAAPI device found');
    }
    return [`-init_hw_device vaapi=accel:/dev/dri/${this.devices[0]}`, '-filter_hw_device accel'];
  }

  getBaseOutputOptions() {
    return [`-vcodec ${this.config.targetVideoCodec}_vaapi`];
  }

  getFilterOptions(stream: VideoStreamInfo) {
    const options = ['format=nv12', 'hwupload'];
    if (this.shouldScale(stream)) {
      options.push(`scale_vaapi=${this.getScaling(stream)}`);
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
    // VAAPI doesn't allow setting both quality and max bitrate
    if (bitrates.max > 0) {
      return [
        `-b:v ${bitrates.target}${bitrates.unit}`,
        `-maxrate ${bitrates.max}${bitrates.unit}`,
        `-minrate ${bitrates.min}${bitrates.unit}`,
        '-rc_mode 3',
      ]; // variable bitrate
    } else {
      return [`-qp ${this.config.crf}`, `-global_quality ${this.config.crf}`, '-rc_mode 1']; // constant quality
    }
  }
}
