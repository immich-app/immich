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
      twoPass: eligibleForTwoPass(this.config),
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
    if (shouldScale(stream, this.config)) {
      options.push(`scale=${getScaling(stream, this.config)}`);
    }

    return options;
  }

  getPresetOptions() {
    return [`-preset ${this.config.preset}`];
  }

  abstract getBitrateOptions(): Array<string>;
  abstract getThreadOptions(): Array<string>;
}

export class H264Handler extends BaseHandler implements VideoCodecSWHandler {
  getBitrateOptions() {
    const bitrates = getBitrateDistribution(this.config);
    if (eligibleForTwoPass(this.config)) {
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
    const speed = Math.min(getPresetIndex(this.config.preset), 5); // values over 5 require realtime mode, which is its own can of worms since it overrides -crf and -threads
    if (speed >= 0) {
      return [`-cpu-used ${speed}`];
    }
    return [];
  }

  getBitrateOptions() {
    const bitrates = getBitrateDistribution(this.config);
    if (eligibleForTwoPass(this.config)) {
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

export function eligibleForTwoPass(config: SystemConfigFFmpegDto) {
  if (!config.twoPass) {
    return false;
  }

  return isBitrateConstrained(config) || config.targetVideoCodec === 'vp9';
}

export function getBitrateDistribution(config: SystemConfigFFmpegDto) {
  const max = getMaxBitrateValue(config);
  const target = Math.ceil(max / 1.45); // recommended by https://developers.google.com/media/vp9/settings/vod
  const min = target / 2;
  const unit = getBitrateUnit(config);

  return { max, target, min, unit } as BitrateDistribution;
}

export function getTargetResolution(stream: VideoStreamInfo, config: SystemConfigFFmpegDto) {
  if (config.targetResolution === 'original') {
    return Math.min(stream.height, stream.width);
  }

  return Number.parseInt(config.targetResolution);
}

export function shouldScale(stream: VideoStreamInfo, config: SystemConfigFFmpegDto) {
  if (config.targetResolution === 'original') {
    return false;
  }
  return Math.min(stream.height, stream.width) > Number.parseInt(config.targetResolution);
}

export function getScaling(stream: VideoStreamInfo, config: SystemConfigFFmpegDto) {
  const targetResolution = getTargetResolution(stream, config);
  return isVideoVertical(stream) ? `${targetResolution}:-2` : `-2:${targetResolution}`;
}

export function isVideoRotated(stream: VideoStreamInfo) {
  return Math.abs(stream.rotation) === 90;
}

export function isVideoVertical(stream: VideoStreamInfo) {
  return stream.height > stream.width || isVideoRotated(stream);
}

export function isBitrateConstrained(config: SystemConfigFFmpegDto) {
  return getMaxBitrateValue(config) > 0;
}

export function getBitrateUnit(config: SystemConfigFFmpegDto) {
  const maxBitrate = getMaxBitrateValue(config);
  return config.maxBitrate.trim().substring(maxBitrate.toString().length); // use inputted unit if provided
}

export function getMaxBitrateValue(config: SystemConfigFFmpegDto) {
  return Number.parseInt(config.maxBitrate) || 0;
}

export function getPresetIndex(preset: string) {
  const presets = ['veryslow', 'slower', 'slow', 'medium', 'fast', 'faster', 'veryfast', 'superfast', 'ultrafast'];
  return presets.indexOf(preset);
}
