import { SystemConfigFFmpegDto } from 'src/dtos/system-config.dto';
import { CQMode, ToneMapping, TranscodeHWAccel, TranscodeTarget, VideoCodec } from 'src/enum';
import {
  AudioStreamInfo,
  BitrateDistribution,
  TranscodeCommand,
  VideoCodecHWConfig,
  VideoCodecSWConfig,
  VideoStreamInfo,
} from 'src/interfaces/media.interface';

export class BaseConfig implements VideoCodecSWConfig {
  readonly presets = ['veryslow', 'slower', 'slow', 'medium', 'fast', 'faster', 'veryfast', 'superfast', 'ultrafast'];
  protected constructor(protected config: SystemConfigFFmpegDto) {}

  static create(config: SystemConfigFFmpegDto, devices: string[] = [], hasMaliOpenCL = false): VideoCodecSWConfig {
    if (config.accel === TranscodeHWAccel.DISABLED) {
      return this.getSWCodecConfig(config);
    }
    return this.getHWCodecConfig(config, devices, hasMaliOpenCL);
  }

  private static getSWCodecConfig(config: SystemConfigFFmpegDto) {
    switch (config.targetVideoCodec) {
      case VideoCodec.H264: {
        return new H264Config(config);
      }
      case VideoCodec.HEVC: {
        return new HEVCConfig(config);
      }
      case VideoCodec.VP9: {
        return new VP9Config(config);
      }
      case VideoCodec.AV1: {
        return new AV1Config(config);
      }
      default: {
        throw new Error(`Codec '${config.targetVideoCodec}' is unsupported`);
      }
    }
  }

  private static getHWCodecConfig(config: SystemConfigFFmpegDto, devices: string[] = [], hasMaliOpenCL = false) {
    let handler: VideoCodecHWConfig;
    switch (config.accel) {
      case TranscodeHWAccel.NVENC: {
        handler = config.accelDecode ? new NvencHwDecodeConfig(config) : new NvencSwDecodeConfig(config);
        break;
      }
      case TranscodeHWAccel.QSV: {
        handler = config.accelDecode ? new QsvHwDecodeConfig(config, devices) : new QsvSwDecodeConfig(config, devices);
        break;
      }
      case TranscodeHWAccel.VAAPI: {
        handler = new VAAPIConfig(config, devices);
        break;
      }
      case TranscodeHWAccel.RKMPP: {
        handler =
          config.accelDecode && hasMaliOpenCL
            ? new RkmppHwDecodeConfig(config, devices)
            : new RkmppSwDecodeConfig(config, devices);
        break;
      }
      default: {
        throw new Error(`${config.accel.toUpperCase()} acceleration is unsupported`);
      }
    }
    if (!handler.getSupportedCodecs().includes(config.targetVideoCodec)) {
      throw new Error(
        `${config.accel.toUpperCase()} acceleration does not support codec '${config.targetVideoCodec.toUpperCase()}'. Supported codecs: ${handler.getSupportedCodecs()}`,
      );
    }

    return handler;
  }

  getCommand(target: TranscodeTarget, videoStream: VideoStreamInfo, audioStream?: AudioStreamInfo) {
    const options = {
      inputOptions: this.getBaseInputOptions(videoStream),
      outputOptions: [...this.getBaseOutputOptions(target, videoStream, audioStream), '-v verbose'],
      twoPass: this.eligibleForTwoPass(),
      progress: { frameCount: videoStream.frameCount, percentInterval: 5 },
    } as TranscodeCommand;
    if ([TranscodeTarget.ALL, TranscodeTarget.VIDEO].includes(target)) {
      const filters = this.getFilterOptions(videoStream);
      if (filters.length > 0) {
        options.outputOptions.push(`-vf ${filters.join(',')}`);
      }
    }

    options.outputOptions.push(
      ...this.getPresetOptions(),
      ...this.getOutputThreadOptions(),
      ...this.getBitrateOptions(),
    );

    return options;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getBaseInputOptions(videoStream: VideoStreamInfo): string[] {
    return this.getInputThreadOptions();
  }

  getBaseOutputOptions(target: TranscodeTarget, videoStream: VideoStreamInfo, audioStream?: AudioStreamInfo) {
    const videoCodec = [TranscodeTarget.ALL, TranscodeTarget.VIDEO].includes(target) ? this.getVideoCodec() : 'copy';
    const audioCodec = [TranscodeTarget.ALL, TranscodeTarget.AUDIO].includes(target) ? this.getAudioCodec() : 'copy';

    const options = [
      `-c:v ${videoCodec}`,
      `-c:a ${audioCodec}`,
      // Makes a second pass moving the moov atom to the
      // beginning of the file for improved playback speed.
      '-movflags faststart',
      '-fps_mode passthrough',
      // explicitly selects the video stream instead of leaving it up to FFmpeg
      `-map 0:${videoStream.index}`,
      '-strict unofficial',
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

    if (
      this.config.targetVideoCodec === VideoCodec.HEVC &&
      (videoCodec !== 'copy' || videoStream.codecName === 'hevc')
    ) {
      options.push('-tag:v hvc1');
    }

    return options;
  }

  getFilterOptions(videoStream: VideoStreamInfo) {
    const options = [];
    if (this.shouldScale(videoStream)) {
      options.push(`scale=${this.getScaling(videoStream)}`);
    }

    options.push(...this.getToneMapping(videoStream), 'format=yuv420p');
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

  getInputThreadOptions(): Array<string> {
    return [];
  }

  getOutputThreadOptions(): Array<string> {
    if (this.config.threads <= 0) {
      return [];
    }
    return [`-threads ${this.config.threads}`];
  }

  eligibleForTwoPass() {
    if (!this.config.twoPass || this.config.accel !== TranscodeHWAccel.DISABLED) {
      return false;
    }

    return this.isBitrateConstrained();
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

  getScaling(videoStream: VideoStreamInfo, mult = 2) {
    const targetResolution = this.getTargetResolution(videoStream);
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

  getToneMapping(videoStream: VideoStreamInfo) {
    if (!this.shouldToneMap(videoStream)) {
      return [];
    }

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
    return [VideoCodec.H264, VideoCodec.HEVC];
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

  getPreferredHardwareDevice(): string | undefined {
    const device = this.config.preferredHwDevice;
    if (device === 'auto') {
      return;
    }

    const deviceName = device.replace('/dev/dri/', '');
    if (!this.devices.includes(deviceName)) {
      throw new Error(`Device '${device}' does not exist`);
    }

    return `/dev/dri/${deviceName}`;
  }
}

export class ThumbnailConfig extends BaseConfig {
  static create(config: SystemConfigFFmpegDto): VideoCodecSWConfig {
    return new ThumbnailConfig(config);
  }

  getBaseInputOptions(): string[] {
    return ['-skip_frame nointra', '-sws_flags accurate_rnd+full_chroma_int'];
  }

  getBaseOutputOptions() {
    return ['-fps_mode vfr', '-frames:v 1', '-update 1'];
  }

  getFilterOptions(videoStream: VideoStreamInfo): string[] {
    const options = [
      'fps=12:eof_action=pass:round=down',
      'thumbnail=12',
      String.raw`select=gt(scene\,0.1)-eq(prev_selected_n\,n)+isnan(prev_selected_n)+gt(n\,20)`,
      'trim=end_frame=2',
      'reverse',
    ];
    if (this.shouldScale(videoStream)) {
      options.push(`scale=${this.getScaling(videoStream)}`);
    }

    options.push(...this.getToneMapping(videoStream), 'format=yuv420p');
    return options;
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
    let options = super.getScaling(videoStream) + ':flags=lanczos+accurate_rnd+full_chroma_int';
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
  getOutputThreadOptions() {
    const options = super.getOutputThreadOptions();
    if (this.config.threads === 1) {
      options.push('-x264-params frame-threads=1:pools=none');
    }

    return options;
  }
}

export class HEVCConfig extends BaseConfig {
  getOutputThreadOptions() {
    const options = super.getOutputThreadOptions();
    if (this.config.threads === 1) {
      options.push('-x265-params frame-threads=1:pools=none');
    }

    return options;
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

  getOutputThreadOptions() {
    return ['-row-mt 1', ...super.getOutputThreadOptions()];
  }

  eligibleForTwoPass() {
    return this.config.twoPass;
  }
}

export class AV1Config extends BaseConfig {
  getPresetOptions() {
    const speed = this.getPresetIndex() + 4; // Use 4 as slowest, giving us an effective range of 4-12 which is far more useful than 0-8
    if (speed >= 0) {
      return [`-preset ${speed}`];
    }
    return [];
  }

  getBitrateOptions() {
    const options = [`-crf ${this.config.crf}`];
    const bitrates = this.getBitrateDistribution();
    const svtparams = [];
    if (this.config.threads > 0) {
      svtparams.push(`lp=${this.config.threads}`);
    }
    if (bitrates.max > 0) {
      svtparams.push(`mbr=${bitrates.max}${bitrates.unit}`);
    }
    if (svtparams.length > 0) {
      options.push(`-svtav1-params ${svtparams.join(':')}`);
    }
    return options;
  }

  getOutputThreadOptions() {
    return []; // Already set above with svtav1-params
  }

  eligibleForTwoPass() {
    return this.config.twoPass;
  }
}

export class NvencSwDecodeConfig extends BaseHWConfig {
  getSupportedCodecs() {
    return [VideoCodec.H264, VideoCodec.HEVC, VideoCodec.AV1];
  }

  getBaseInputOptions() {
    return ['-init_hw_device cuda=cuda:0', '-filter_hw_device cuda'];
  }

  getBaseOutputOptions(target: TranscodeTarget, videoStream: VideoStreamInfo, audioStream?: AudioStreamInfo) {
    const options = [
      // below settings recommended from https://docs.nvidia.com/video-technologies/video-codec-sdk/12.0/ffmpeg-with-nvidia-gpu/index.html#command-line-for-latency-tolerant-high-quality-transcoding
      '-tune hq',
      '-qmin 0',
      '-rc-lookahead 20',
      '-i_qfactor 0.75',
      ...super.getBaseOutputOptions(target, videoStream, audioStream),
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
    const options = this.getToneMapping(videoStream);
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

export class NvencHwDecodeConfig extends NvencSwDecodeConfig {
  getBaseInputOptions() {
    return ['-hwaccel cuda', '-hwaccel_output_format cuda', '-noautorotate', ...this.getInputThreadOptions()];
  }

  getFilterOptions(videoStream: VideoStreamInfo) {
    const options = [];
    if (this.shouldScale(videoStream)) {
      options.push(`scale_cuda=${this.getScaling(videoStream)}`);
    }
    options.push(...this.getToneMapping(videoStream));
    if (options.length > 0) {
      options[options.length - 1] += ':format=nv12';
    }
    return options;
  }

  getToneMapping(videoStream: VideoStreamInfo) {
    if (!this.shouldToneMap(videoStream)) {
      return [];
    }

    const colors = this.getColors();
    const tonemapOptions = [
      'desat=0',
      `matrix=${colors.matrix}`,
      `primaries=${colors.primaries}`,
      'range=pc',
      `tonemap=${this.config.tonemap}`,
      `transfer=${colors.transfer}`,
    ];

    return [`tonemap_cuda=${tonemapOptions.join(':')}`];
  }

  getInputThreadOptions() {
    return [`-threads 1`];
  }

  getOutputThreadOptions() {
    return [];
  }
}

export class QsvSwDecodeConfig extends BaseHWConfig {
  getBaseInputOptions() {
    if (this.devices.length === 0) {
      throw new Error('No QSV device found');
    }

    let qsvString = '';
    const hwDevice = this.getPreferredHardwareDevice();
    if (hwDevice) {
      qsvString = `,child_device=${hwDevice}`;
    }

    return [`-init_hw_device qsv=hw${qsvString}`, '-filter_hw_device hw'];
  }

  getBaseOutputOptions(target: TranscodeTarget, videoStream: VideoStreamInfo, audioStream?: AudioStreamInfo) {
    const options = super.getBaseOutputOptions(target, videoStream, audioStream);
    // VP9 requires enabling low power mode https://git.ffmpeg.org/gitweb/ffmpeg.git/commit/33583803e107b6d532def0f9d949364b01b6ad5a
    if (this.config.targetVideoCodec === VideoCodec.VP9) {
      options.push('-low_power 1');
    }
    return options;
  }

  getFilterOptions(videoStream: VideoStreamInfo) {
    const options = this.getToneMapping(videoStream);
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
    options.push(`-${this.useCQP() ? 'q:v' : 'global_quality:v'} ${this.config.crf}`);
    const bitrates = this.getBitrateDistribution();
    if (bitrates.max > 0) {
      options.push(`-maxrate ${bitrates.max}${bitrates.unit}`, `-bufsize ${bitrates.max * 2}${bitrates.unit}`);
    }
    return options;
  }

  getSupportedCodecs() {
    return [VideoCodec.H264, VideoCodec.HEVC, VideoCodec.VP9, VideoCodec.AV1];
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

  getScaling(videoStream: VideoStreamInfo): string {
    return super.getScaling(videoStream, 1);
  }
}

export class QsvHwDecodeConfig extends QsvSwDecodeConfig {
  getBaseInputOptions() {
    if (this.devices.length === 0) {
      throw new Error('No QSV device found');
    }

    const options = [
      '-hwaccel qsv',
      '-hwaccel_output_format qsv',
      '-async_depth 4',
      '-noautorotate',
      ...this.getInputThreadOptions(),
    ];
    const hwDevice = this.getPreferredHardwareDevice();
    if (hwDevice) {
      options.push(`-qsv_device ${hwDevice}`);
    }

    return options;
  }

  getFilterOptions(videoStream: VideoStreamInfo) {
    const options = [];
    if (this.shouldScale(videoStream) || !this.shouldToneMap(videoStream)) {
      let scaling = `scale_qsv=${this.getScaling(videoStream)}:async_depth=4:mode=hq`;
      if (!this.shouldToneMap(videoStream)) {
        scaling += ':format=nv12';
      }
      options.push(scaling);
    }

    options.push(...this.getToneMapping(videoStream));
    return options;
  }

  getToneMapping(videoStream: VideoStreamInfo): string[] {
    if (!this.shouldToneMap(videoStream)) {
      return [];
    }

    const colors = this.getColors();
    const tonemapOptions = [
      'desat=0',
      'format=nv12',
      `matrix=${colors.matrix}`,
      `primaries=${colors.primaries}`,
      'range=pc',
      `tonemap=${this.config.tonemap}`,
      `transfer=${colors.transfer}`,
    ];

    return [
      'hwmap=derive_device=opencl',
      `tonemap_opencl=${tonemapOptions.join(':')}`,
      'hwmap=derive_device=qsv:reverse=1,format=qsv',
    ];
  }

  getInputThreadOptions() {
    return [`-threads 1`];
  }
}

export class VAAPIConfig extends BaseHWConfig {
  getBaseInputOptions() {
    if (this.devices.length === 0) {
      throw new Error('No VAAPI device found');
    }

    let hwDevice = this.getPreferredHardwareDevice();
    if (!hwDevice) {
      hwDevice = `/dev/dri/${this.devices[0]}`;
    }

    return [`-init_hw_device vaapi=accel:${hwDevice}`, '-filter_hw_device accel'];
  }

  getFilterOptions(videoStream: VideoStreamInfo) {
    const options = this.getToneMapping(videoStream);
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
      options.push(`-qp:v ${this.config.crf}`, `-global_quality:v ${this.config.crf}`, '-rc_mode 1');
    } else {
      options.push(`-global_quality:v ${this.config.crf}`, '-rc_mode 4');
    }

    return options;
  }

  getSupportedCodecs() {
    return [VideoCodec.H264, VideoCodec.HEVC, VideoCodec.VP9, VideoCodec.AV1];
  }

  useCQP() {
    return this.config.cqMode !== CQMode.ICQ || this.config.targetVideoCodec === VideoCodec.VP9;
  }
}

export class RkmppSwDecodeConfig extends BaseHWConfig {
  constructor(
    protected config: SystemConfigFFmpegDto,
    devices: string[] = [],
  ) {
    super(config, devices);
  }

  eligibleForTwoPass(): boolean {
    return false;
  }

  getBaseInputOptions(): string[] {
    if (this.devices.length === 0) {
      throw new Error('No RKMPP device found');
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
      // -b:v specifies max bitrate, average bitrate is derived automatically...
      return ['-rc_mode AVBR', `-b:v ${bitrate}${this.getBitrateUnit()}`];
    }
    // use CRF value as QP value
    return ['-rc_mode CQP', `-qp_init ${this.config.crf}`];
  }

  getSupportedCodecs() {
    return [VideoCodec.H264, VideoCodec.HEVC];
  }

  getVideoCodec(): string {
    return `${this.config.targetVideoCodec}_rkmpp`;
  }
}

export class RkmppHwDecodeConfig extends RkmppSwDecodeConfig {
  getBaseInputOptions() {
    if (this.devices.length === 0) {
      throw new Error('No RKMPP device found');
    }

    return ['-hwaccel rkmpp', '-hwaccel_output_format drm_prime', '-afbc rga', '-noautorotate'];
  }

  getFilterOptions(videoStream: VideoStreamInfo) {
    if (this.shouldToneMap(videoStream)) {
      const colors = this.getColors();
      return [
        `scale_rkrga=${this.getScaling(videoStream)}:format=p010:afbc=1`,
        'hwmap=derive_device=opencl:mode=read',
        `tonemap_opencl=format=nv12:r=pc:p=${colors.primaries}:t=${colors.transfer}:m=${colors.matrix}:tonemap=${this.config.tonemap}:desat=0`,
        'hwmap=derive_device=rkmpp:mode=write:reverse=1',
        'format=drm_prime',
      ];
    } else if (this.shouldScale(videoStream)) {
      return [`scale_rkrga=${this.getScaling(videoStream)}:format=nv12:afbc=1`];
    }
    return [];
  }
}
