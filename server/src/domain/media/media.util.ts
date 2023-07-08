import { SystemConfigFFmpegDto } from '../system-config/dto';
import { BitrateDistribution, TranscodeOptions, VideoCodecSWConfig, VideoStreamInfo } from './media.repository';

class BaseConfig implements VideoCodecSWConfig {
  constructor(protected config: SystemConfigFFmpegDto) {}

  getOptions(stream: VideoStreamInfo) {
    const options = {
      inputOptions: this.getBaseInputOptions(),
      outputOptions: this.getBaseOutputOptions(),
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
    return [
      `-vcodec ${this.config.targetVideoCodec}`,
      `-acodec ${this.config.targetAudioCodec}`,
      // Makes a second pass moving the moov atom to the beginning of
      // the file for improved playback speed.
      '-movflags faststart',
      '-fps_mode passthrough',
    ];
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
    if (!this.config.twoPass) {
      return false;
    }

    return this.isBitrateConstrained() || this.config.targetVideoCodec === 'vp9';
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
    return this.isVideoVertical(stream) ? `${targetResolution}:-2` : `-2:${targetResolution}`;
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
