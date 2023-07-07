import { BitrateDistribution, TranscodeOptions, VideoCodecSWHandler, VideoStreamInfo } from '.';
import { SystemConfigFFmpegDto } from '..';

abstract class BaseHandler {
  protected config: SystemConfigFFmpegDto;

  constructor(config: SystemConfigFFmpegDto) {
    this.config = config;
  }

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

  getBaseInputOptions() {
    return [] as Array<string>;
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

  abstract getBitrateOptions(): Array<string>;
  abstract getThreadOptions(): Array<string>;

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
    if (this.config.targetResolution === 'original') {
      return false;
    }
    return Math.min(stream.height, stream.width) > Number.parseInt(this.config.targetResolution);
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

export class H264Handler extends BaseHandler implements VideoCodecSWHandler {
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
      // needed for -maxrate to be enforced
      return [
        `-crf ${this.config.crf}`,
        `-maxrate ${bitrates.max}${bitrates.unit}`,
        `-bufsize ${bitrates.max * 2}${bitrates.unit}`,
      ];
    } else {
      return [`-crf ${this.config.crf}`];
    }
  }

  getThreadOptions() {
    if (this.config.threads <= 0) {
      return [];
    }
    return [
      `-threads ${this.config.threads}`,
      '-x264-params "pools=none"',
      `-x264-params "frame-threads=${this.config.threads}"`,
    ];
  }
}

export class HEVCHandler extends H264Handler {
  getThreadOptions() {
    if (this.config.threads <= 0) {
      return [];
    }
    return [
      `-threads ${this.config.threads}`,
      '-x265-params "pools=none"',
      `-x265-params "frame-threads=${this.config.threads}"`,
    ];
  }
}

export class VP9Handler extends BaseHandler implements VideoCodecSWHandler {
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
    const options = ['-row-mt 1'];
    if (this.config.threads) {
      options.push(`-threads ${this.config.threads}`);
    }
    return options;
  }
}
