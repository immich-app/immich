import { AUDIO_ENCODER, AV1_LEVELS, CodecLevel, H264_LEVELS, HEVC_LEVELS, SUPPORTED_HWA_CODECS } from 'src/constants';
import { SystemConfigFFmpegDto } from 'src/dtos/system-config.dto';
import {
  ColorMatrix,
  ColorPrimaries,
  ColorTransfer,
  CQMode,
  ToneMapping,
  TranscodeHardwareAcceleration,
  TranscodeTarget,
  VideoCodec,
} from 'src/enum';
import {
  AudioStreamInfo,
  BitrateDistribution,
  HlsCommandOptions,
  TranscodeCommand,
  VideoCodecSWConfig,
  VideoFormat,
  VideoInterfaces,
  VideoStreamInfo,
  VideoTuning,
} from 'src/types';

export const isVideoRotated = (videoStream: VideoStreamInfo): boolean => Math.abs(videoStream.rotation) === 90;

export const isVideoVertical = (videoStream: VideoStreamInfo): boolean =>
  videoStream.height > videoStream.width || isVideoRotated(videoStream);

export const getOutputSize = (videoStream: VideoStreamInfo, targetRes: number) => {
  const factor = Math.max(videoStream.height, videoStream.width) / Math.min(videoStream.height, videoStream.width);
  let larger = Math.round(targetRes * factor);
  if (larger % 2 !== 0) {
    larger -= 1;
  }
  return isVideoVertical(videoStream) ? { width: targetRes, height: larger } : { width: larger, height: targetRes };
};

const pickLevel = (levels: CodecLevel[], frame: number, rate: number) =>
  levels.find((level) => frame <= level.maxFrame && rate <= level.maxRate) ?? levels.at(-1)!;

export const getCodecString = (codec: VideoCodec, width: number, height: number, fps: number): string => {
  switch (codec) {
    case VideoCodec.H264: {
      const macroblocks = Math.ceil(width / 16) * Math.ceil(height / 16);
      return `avc1.6400${pickLevel(H264_LEVELS, macroblocks, macroblocks * fps).token}`;
    }
    case VideoCodec.Hevc: {
      const samples = width * height;
      return `hvc1.1.6.${pickLevel(HEVC_LEVELS, samples, samples * fps).token}.B0`;
    }
    case VideoCodec.Av1: {
      const samples = width * height;
      return `av01.0.${pickLevel(AV1_LEVELS, samples, samples * fps).token}.08`;
    }
    default: {
      throw new Error(`Codec '${codec}' does not support HLS codec strings`);
    }
  }
};

export class BaseConfig implements VideoCodecSWConfig {
  readonly presets = ['veryslow', 'slower', 'slow', 'medium', 'fast', 'faster', 'veryfast', 'superfast', 'ultrafast'];
  protected constructor(
    protected config: SystemConfigFFmpegDto,
    protected tune: VideoTuning = { strictGop: false, lowLatency: false },
  ) {}

  static create(config: SystemConfigFFmpegDto, interfaces: VideoInterfaces, tune?: VideoTuning) {
    if (config.accel === TranscodeHardwareAcceleration.Disabled) {
      return this.getSWCodecConfig(config, tune);
    }
    return this.getHWCodecConfig(config, interfaces, tune);
  }

  private static getSWCodecConfig(config: SystemConfigFFmpegDto, tune?: VideoTuning): VideoCodecSWConfig {
    switch (config.targetVideoCodec) {
      case VideoCodec.H264: {
        return new H264Config(config, tune);
      }
      case VideoCodec.Hevc: {
        return new HEVCConfig(config, tune);
      }
      case VideoCodec.Vp9: {
        return new VP9Config(config, tune);
      }
      case VideoCodec.Av1: {
        return new AV1Config(config, tune);
      }
      default: {
        throw new Error(`Codec '${config.targetVideoCodec}' is unsupported`);
      }
    }
  }

  private static getHWCodecConfig(config: SystemConfigFFmpegDto, interfaces: VideoInterfaces, tune?: VideoTuning) {
    if (!SUPPORTED_HWA_CODECS[config.accel].includes(config.targetVideoCodec)) {
      throw new Error(
        `${config.accel.toUpperCase()} acceleration does not support codec '${config.targetVideoCodec.toUpperCase()}'. Supported codecs: ${SUPPORTED_HWA_CODECS[config.accel]}`,
      );
    }

    let handler: VideoCodecSWConfig;
    switch (config.accel) {
      case TranscodeHardwareAcceleration.Nvenc: {
        handler = config.accelDecode
          ? new NvencHwDecodeConfig(config, interfaces, tune)
          : new NvencSwDecodeConfig(config, interfaces, tune);
        break;
      }
      case TranscodeHardwareAcceleration.Qsv: {
        handler = config.accelDecode
          ? new QsvHwDecodeConfig(config, interfaces, tune)
          : new QsvSwDecodeConfig(config, interfaces, tune);
        break;
      }
      case TranscodeHardwareAcceleration.Vaapi: {
        handler = config.accelDecode
          ? new VaapiHwDecodeConfig(config, interfaces, tune)
          : new VaapiSwDecodeConfig(config, interfaces, tune);
        break;
      }
      case TranscodeHardwareAcceleration.Rkmpp: {
        handler = config.accelDecode
          ? new RkmppHwDecodeConfig(config, interfaces, tune)
          : new RkmppSwDecodeConfig(config, interfaces, tune);
        break;
      }
      default: {
        throw new Error(`${config.accel.toUpperCase()} acceleration is unsupported`);
      }
    }

    return handler;
  }

  getCommand(target: TranscodeTarget, video: VideoStreamInfo, audio?: AudioStreamInfo, format?: VideoFormat) {
    const options = {
      inputOptions: this.getBaseInputOptions(video, format),
      outputOptions: [
        ...this.getBaseOutputOptions(target, video, audio),
        ...this.getPresetOptions(),
        ...this.getBitrateOptions(),
        ...this.getEncoderOptions(),
        '-movflags',
        'faststart',
        '-fps_mode',
        'passthrough',
        '-v',
        'verbose',
      ],
      twoPass: this.eligibleForTwoPass(),
      progress: { frameCount: video.frameCount, percentInterval: 5 },
    } as TranscodeCommand;
    if ([TranscodeTarget.All, TranscodeTarget.Video].includes(target)) {
      const filters = this.getFilterOptions(video);
      if (filters.length > 0) {
        options.outputOptions.push('-vf', filters.join(','));
      }
    }

    return options;
  }

  getHlsCommand(options: HlsCommandOptions, video: VideoStreamInfo, audio?: AudioStreamInfo) {
    const args: string[] = this.getBaseInputOptions(video);
    if (options.seekSeconds) {
      args.push('-ss', String(options.seekSeconds));
    }
    args.push(
      '-nostdin',
      '-nostats',
      '-i',
      options.inputPath,
      ...this.getBaseOutputOptions(options.target, video, audio),
      ...this.getPresetOptions(),
      ...this.getBitrateOptions(),
      ...this.getEncoderOptions(),
      '-copyts',
      '-r',
      `${options.packetCount * options.timeBase}/${options.totalDuration}`,
      '-avoid_negative_ts',
      'disabled',
      '-f',
      'hls',
      '-hls_time',
      String(options.segmentDuration),
      '-hls_list_size',
      '0',
      '-hls_segment_type',
      'fmp4',
      '-hls_fmp4_init_filename',
      options.initFilename,
      '-hls_segment_options',
      'movflags=+frag_discont',
      '-hls_flags',
      'temp_file',
      '-hls_segment_filename',
      options.segmentFilename,
      '-start_number',
      String(options.startSegment),
    );

    if ([TranscodeTarget.All, TranscodeTarget.Video].includes(options.target)) {
      const filters = this.getFilterOptions(video);
      if (filters.length > 0) {
        args.push('-vf', filters.join(','));
      }
    }
    args.push(options.playlistFilename);
    return args;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getBaseInputOptions(videoStream: VideoStreamInfo, format?: VideoFormat): string[] {
    return this.getInputThreadOptions();
  }

  getBaseOutputOptions(target: TranscodeTarget, videoStream: VideoStreamInfo, audioStream?: AudioStreamInfo) {
    const videoCodec = [TranscodeTarget.All, TranscodeTarget.Video].includes(target) ? this.getVideoCodec() : 'copy';
    const audioCodec = [TranscodeTarget.All, TranscodeTarget.Audio].includes(target) ? this.getAudioEncoder() : 'copy';

    const options = ['-c:v', videoCodec, '-c:a', audioCodec, '-map', `0:${videoStream.index}`, '-map_metadata', '-1'];
    if (audioStream) {
      options.push('-map', `0:${audioStream.index}`);
      // If there are more than 2 channels sometimes the channel config is broken when re-encoded
      // TODO: Store the number of channels in the db and then set it during the transcoding: -channel_layout 5.1
      if ([TranscodeTarget.All, TranscodeTarget.Audio].includes(target)) {
        options.push('-ac', '2');
      }
    }
    if (this.getBFrames() > -1) {
      options.push('-bf', `${this.getBFrames()}`);
    }
    if (this.getRefs() > 0) {
      options.push('-refs', `${this.getRefs()}`);
    }
    if (this.getGopSize() > 0) {
      options.push('-g', `${this.getGopSize()}`);
      if (this.tune.strictGop) {
        options.push('-keyint_min', `${this.getGopSize()}`);
      }
    }
    const isHvc = (videoCodec === 'copy' ? videoStream.codecName : videoCodec) === VideoCodec.Hevc;
    if (isHvc) {
      options.push('-tag:v', 'hvc1');
    }

    return options;
  }

  getEncoderOptions(): string[] {
    return [];
  }

  getFilterOptions(videoStream: VideoStreamInfo) {
    const options = [];
    if (this.shouldScale(videoStream)) {
      options.push(`scale=${this.getScaling(videoStream)}`);
    }

    const tonemapOptions = this.getToneMapping(videoStream);
    if (tonemapOptions.length > 0) {
      options.push(...tonemapOptions);
    } else if (!videoStream.pixelFormat.endsWith('420p')) {
      options.push('format=yuv420p');
    }

    return options;
  }

  getPresetOptions() {
    return ['-preset', this.config.preset];
  }

  getBitrateOptions() {
    const bitrates = this.getBitrateDistribution();
    if (this.eligibleForTwoPass()) {
      return [
        '-b:v',
        `${bitrates.target}${bitrates.unit}`,
        '-minrate',
        `${bitrates.min}${bitrates.unit}`,
        '-maxrate',
        `${bitrates.max}${bitrates.unit}`,
      ];
    } else if (bitrates.max > 0) {
      // -bufsize is the peak possible bitrate at any moment, while -maxrate is the max rolling average bitrate
      return [
        `-${this.useCQP() ? 'q:v' : 'crf'}`,
        `${this.config.crf}`,
        '-maxrate',
        `${bitrates.max}${bitrates.unit}`,
        '-bufsize',
        `${bitrates.max * 2}${bitrates.unit}`,
      ];
    } else {
      return [`-${this.useCQP() ? 'q:v' : 'crf'}`, `${this.config.crf}`];
    }
  }

  getInputThreadOptions(): Array<string> {
    return [];
  }

  getOutputThreadOptions(): Array<string> {
    if (this.config.threads <= 0) {
      return [];
    }
    return ['-threads', `${this.config.threads}`];
  }

  eligibleForTwoPass() {
    if (!this.config.twoPass || this.config.accel !== TranscodeHardwareAcceleration.Disabled) {
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
    return (
      this.config.tonemap !== ToneMapping.Disabled &&
      (videoStream.colorTransfer === ColorTransfer.Smpte2084 || videoStream.colorTransfer === ColorTransfer.AribStdB67)
    );
  }

  getScaling(videoStream: VideoStreamInfo, mult = 2) {
    const targetResolution = this.getTargetResolution(videoStream);
    return isVideoVertical(videoStream) ? `${targetResolution}:-${mult}` : `-${mult}:${targetResolution}`;
  }

  isBitrateConstrained() {
    return this.getMaxBitrateValue() > 0;
  }

  getBitrateUnit() {
    const maxBitrate = this.getMaxBitrateValue();
    return this.config.maxBitrate.trim().slice(maxBitrate.toString().length) || 'k'; // use inputted unit if provided, else default to kbps
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

  getToneMapping(videoStream: VideoStreamInfo) {
    if (!this.shouldToneMap(videoStream)) {
      return [];
    }

    const { primaries, transfer, matrix } = this.getColors();
    const options = `tonemapx=tonemap=${this.config.tonemap}:desat=0:p=${primaries}:t=${transfer}:m=${matrix}:r=pc:peak=100:format=yuv420p`;
    return [options];
  }

  getAudioEncoder(): string {
    return AUDIO_ENCODER[this.config.targetAudioCodec];
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
    return this.config.cqMode === CQMode.Cqp;
  }
}

export class BaseHWConfig extends BaseConfig {
  protected device: string;

  constructor(
    protected config: SystemConfigFFmpegDto,
    protected interfaces: VideoInterfaces,
    tune?: VideoTuning,
  ) {
    super(config, tune);
    this.device = this.getDevice(interfaces);
  }

  validateDevices(devices: string[]) {
    if (devices.length === 0) {
      throw new Error('No /dev/dri devices found. If using Docker, make sure at least one /dev/dri device is mounted');
    }

    return devices.filter(function (device) {
      return device.startsWith('renderD') || device.startsWith('card');
    });
  }

  getDevice({ dri }: VideoInterfaces) {
    if (this.config.preferredHwDevice === 'auto') {
      // eslint-disable-next-line unicorn/no-array-reduce
      return `/dev/dri/${this.validateDevices(dri).reduce(function (a, b) {
        return a.localeCompare(b) < 0 ? b : a;
      })}`;
    }

    const deviceName = this.config.preferredHwDevice.replace('/dev/dri/', '');
    if (!dri.includes(deviceName)) {
      throw new Error(`Device '${deviceName}' does not exist. If using Docker, make sure this device is mounted`);
    }

    return `/dev/dri/${deviceName}`;
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
}

export class ThumbnailConfig extends BaseConfig {
  static create(config: SystemConfigFFmpegDto): VideoCodecSWConfig {
    return new ThumbnailConfig(config);
  }

  getBaseInputOptions(videoStream: VideoStreamInfo, format?: VideoFormat): string[] {
    // skip_frame nointra skips all frames for some MPEG-TS files. Look at ffmpeg tickets 7950 and 7895 for more details.
    const options =
      format?.formatName === 'mpegts'
        ? ['-sws_flags', 'accurate_rnd+full_chroma_int']
        : ['-skip_frame', 'nointra', '-sws_flags', 'accurate_rnd+full_chroma_int'];

    const metadataOverrides = [];
    if (videoStream.colorPrimaries === ColorPrimaries.Reserved) {
      metadataOverrides.push('colour_primaries=1');
    }

    if (videoStream.colorMatrix === ColorMatrix.Reserved) {
      metadataOverrides.push('matrix_coefficients=1');
    }

    if (videoStream.colorTransfer === ColorTransfer.Reserved) {
      metadataOverrides.push('transfer_characteristics=1');
    }

    if (metadataOverrides.length > 0) {
      // workaround for https://fftrac-bg.ffmpeg.org/ticket/11020
      options.push(`-bsf:${videoStream.index}`, `${videoStream.codecName}_metadata=${metadataOverrides.join(':')}`);
    }

    return options;
  }

  getBaseOutputOptions() {
    return ['-fps_mode', 'vfr', '-frames:v', '1', '-update', '1'];
  }

  getFilterOptions(videoStream: VideoStreamInfo): string[] {
    return [
      'fps=12:start_time=0:eof_action=pass:round=down',
      'thumbnail=12',
      String.raw`select=gt(scene\,0.1)-eq(prev_selected_n\,n)+isnan(prev_selected_n)+gt(n\,20)`,
      'trim=end_frame=2',
      'reverse',
      ...super.getFilterOptions(videoStream),
    ];
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
    return super.getScaling(videoStream) + ':flags=lanczos+accurate_rnd+full_chroma_int:out_range=pc';
  }
}

export class H264Config extends BaseConfig {
  getEncoderOptions(): string[] {
    const out = this.getOutputThreadOptions();
    if (this.tune.strictGop) {
      out.push('-sc_threshold:v', '0');
    }
    if (this.config.threads === 1) {
      out.push('-x264-params', 'frame-threads=1:pools=none');
    }
    return out;
  }
}

export class HEVCConfig extends BaseConfig {
  getEncoderOptions(): string[] {
    const out: string[] = this.getOutputThreadOptions();
    const params: string[] = [];
    if (this.tune.strictGop) {
      params.push('no-scenecut=1', 'no-open-gop=1');
    }
    if (this.config.threads === 1) {
      params.push('frame-threads=1', 'pools=none');
    }
    if (params.length > 0) {
      out.push('-x265-params', params.join(':'));
    }
    return out;
  }
}

export class VP9Config extends BaseConfig {
  getPresetOptions() {
    const speed = Math.min(this.getPresetIndex(), 5); // values over 5 require realtime mode, which is its own can of worms since it overrides -crf and -threads
    if (speed >= 0) {
      return ['-cpu-used', `${speed}`];
    }
    return [];
  }

  getBitrateOptions() {
    const bitrates = this.getBitrateDistribution();
    if (bitrates.max > 0 && this.eligibleForTwoPass()) {
      return [
        '-b:v',
        `${bitrates.target}${bitrates.unit}`,
        '-minrate',
        `${bitrates.min}${bitrates.unit}`,
        '-maxrate',
        `${bitrates.max}${bitrates.unit}`,
      ];
    }

    return [`-${this.useCQP() ? 'q:v' : 'crf'}`, `${this.config.crf}`, '-b:v', `${bitrates.max}${bitrates.unit}`];
  }

  getEncoderOptions(): string[] {
    return ['-row-mt', '1', ...this.getOutputThreadOptions()];
  }

  eligibleForTwoPass() {
    return this.config.twoPass;
  }
}

export class AV1Config extends BaseConfig {
  getVideoCodec(): string {
    return 'libsvtav1';
  }

  getPresetOptions() {
    const speed = this.getPresetIndex() + 4; // Use 4 as slowest, giving us an effective range of 4-12 which is far more useful than 0-8
    if (speed >= 0) {
      return ['-preset', `${speed}`];
    }
    return [];
  }

  getBitrateOptions() {
    return ['-crf', `${this.config.crf}`];
  }

  getEncoderOptions(): string[] {
    const params: string[] = [];
    if (this.tune.lowLatency) {
      params.push('hierarchical-levels=3', 'lookahead=0', 'enable-tf=0');
    }
    if (this.config.threads > 0) {
      params.push(`lp=${this.config.threads}`);
    }
    const bitrates = this.getBitrateDistribution();
    if (bitrates.max > 0) {
      params.push(`mbr=${bitrates.max}${bitrates.unit}`);
    }
    return params.length > 0 ? ['-svtav1-params', params.join(':')] : [];
  }

  eligibleForTwoPass() {
    return this.config.twoPass;
  }
}

export class NvencSwDecodeConfig extends BaseHWConfig {
  getDevice() {
    return '0';
  }

  getBaseInputOptions() {
    return ['-init_hw_device', `cuda=cuda:${this.device}`, '-filter_hw_device', 'cuda'];
  }

  getBaseOutputOptions(target: TranscodeTarget, videoStream: VideoStreamInfo, audioStream?: AudioStreamInfo) {
    const options = [
      // below settings recommended from https://docs.nvidia.com/video-technologies/video-codec-sdk/12.0/ffmpeg-with-nvidia-gpu/index.html#command-line-for-latency-tolerant-high-quality-transcoding
      '-tune',
      'hq',
      '-qmin',
      '0',
      '-rc-lookahead',
      '20',
      '-i_qfactor',
      '0.75',
      ...super.getBaseOutputOptions(target, videoStream, audioStream),
    ];
    if (this.getBFrames() > 0) {
      options.push('-b_ref_mode', 'middle', '-b_qfactor', '1.1');
    }
    if (this.config.temporalAQ) {
      options.push('-temporal-aq', '1');
    }
    return options;
  }

  getFilterOptions(videoStream: VideoStreamInfo) {
    const options = this.getToneMapping(videoStream);
    options.push('hwupload_cuda');
    if (this.shouldScale(videoStream)) {
      options.push(`scale_cuda=${this.getScaling(videoStream)}:format=nv12`);
    }

    return options;
  }

  getPresetOptions() {
    let presetIndex = this.getPresetIndex();
    if (presetIndex < 0) {
      return [];
    }
    presetIndex = 7 - Math.min(6, presetIndex); // map to p1-p7; p7 is the highest quality, so reverse index
    return ['-preset', `p${presetIndex}`];
  }

  getBitrateOptions() {
    const bitrates = this.getBitrateDistribution();
    if (bitrates.max > 0 && this.config.twoPass) {
      return [
        '-b:v',
        `${bitrates.target}${bitrates.unit}`,
        '-maxrate',
        `${bitrates.max}${bitrates.unit}`,
        '-bufsize',
        `${bitrates.target}${bitrates.unit}`,
        '-multipass',
        '2',
      ];
    } else if (bitrates.max > 0) {
      return [
        '-cq:v',
        `${this.config.crf}`,
        '-maxrate',
        `${bitrates.max}${bitrates.unit}`,
        '-bufsize',
        `${bitrates.target}${bitrates.unit}`,
      ];
    } else {
      return ['-cq:v', `${this.config.crf}`];
    }
  }

  getThreadOptions() {
    return [];
  }

  getEncoderOptions(): string[] {
    const out = this.getOutputThreadOptions();
    if (this.tune.strictGop) {
      out.push('-forced-idr', '1');
    }
    return out;
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
    return ['-hwaccel', 'cuda', '-hwaccel_output_format', 'cuda', '-noautorotate', ...this.getInputThreadOptions()];
  }

  getFilterOptions(videoStream: VideoStreamInfo) {
    const options = [];
    const tonemapOptions = this.getToneMapping(videoStream);
    if (this.shouldScale(videoStream) || (tonemapOptions.length === 0 && !videoStream.pixelFormat.endsWith('420p'))) {
      options.push(`scale_cuda=${this.getScaling(videoStream)}`);
    }
    options.push(...tonemapOptions);
    if (options.length > 0) {
      options[options.length - 1] += ':format=nv12';
    }
    return options;
  }

  getToneMapping(videoStream: VideoStreamInfo) {
    if (!this.shouldToneMap(videoStream)) {
      return [];
    }

    const { matrix, primaries, transfer } = this.getColors();
    const tonemapOptions = [
      'desat=0',
      `matrix=${matrix}`,
      `primaries=${primaries}`,
      'range=pc',
      `tonemap=${this.config.tonemap}`,
      'tonemap_mode=lum',
      `transfer=${transfer}`,
      'peak=100',
    ];

    return [`tonemap_cuda=${tonemapOptions.join(':')}`];
  }

  getInputThreadOptions() {
    return ['-threads', '1'];
  }

  getEncoderOptions(): string[] {
    return this.tune.strictGop ? ['-forced-idr', '1'] : [];
  }
}

export class QsvSwDecodeConfig extends BaseHWConfig {
  getBaseInputOptions() {
    return ['-init_hw_device', `qsv=hw,child_device=${this.device}`, '-filter_hw_device', 'hw'];
  }

  getBaseOutputOptions(target: TranscodeTarget, videoStream: VideoStreamInfo, audioStream?: AudioStreamInfo) {
    const options = super.getBaseOutputOptions(target, videoStream, audioStream);
    // VP9 requires enabling low power mode https://git.ffmpeg.org/gitweb/ffmpeg.git/commit/33583803e107b6d532def0f9d949364b01b6ad5a
    if (this.config.targetVideoCodec === VideoCodec.Vp9) {
      options.push('-low_power', '1');
    }
    return options;
  }

  getFilterOptions(videoStream: VideoStreamInfo) {
    const options = this.getToneMapping(videoStream);
    options.push('hwupload=extra_hw_frames=64');
    if (this.shouldScale(videoStream)) {
      options.push(`scale_qsv=${this.getScaling(videoStream)}:mode=hq:format=nv12`);
    }
    return options;
  }

  getPresetOptions() {
    let presetIndex = this.getPresetIndex();
    if (presetIndex < 0) {
      return [];
    }
    presetIndex = Math.min(6, presetIndex) + 1; // 1 to 7
    return ['-preset', `${presetIndex}`];
  }

  getBitrateOptions() {
    const options = [`-${this.useCQP() ? 'q:v' : 'global_quality:v'}`, `${this.config.crf}`];
    const bitrates = this.getBitrateDistribution();
    if (bitrates.max > 0) {
      // Workaround for https://github.com/immich-app/immich/issues/29220, to be revisited
      // QSV seems to ignore -maxrate without -b:v
      // -b:v alongside global_quality uses QVBR
      if (!this.useCQP()) {
        options.push('-b:v', `${bitrates.target}${bitrates.unit}`);
      }
      options.push('-maxrate', `${bitrates.max}${bitrates.unit}`, '-bufsize', `${bitrates.max * 2}${bitrates.unit}`);
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
    return this.config.cqMode === CQMode.Cqp || this.config.targetVideoCodec === VideoCodec.Vp9;
  }

  getScaling(videoStream: VideoStreamInfo): string {
    return super.getScaling(videoStream, 1);
  }

  getEncoderOptions(): string[] {
    const out = this.getOutputThreadOptions();
    if (this.tune.strictGop) {
      out.push('-idr_interval', '0');
    }
    return out;
  }
}

export class QsvHwDecodeConfig extends QsvSwDecodeConfig {
  getBaseInputOptions() {
    return [
      '-hwaccel',
      'qsv',
      '-hwaccel_output_format',
      'qsv',
      '-async_depth',
      '4',
      '-noautorotate',
      '-qsv_device',
      this.device,
      ...this.getInputThreadOptions(),
    ];
  }

  getFilterOptions(videoStream: VideoStreamInfo) {
    const options = [];
    const tonemapOptions = this.getToneMapping(videoStream);
    if (tonemapOptions.length === 0 && !videoStream.pixelFormat.endsWith('420p')) {
      options.push(`scale_qsv=${this.getScaling(videoStream)}:async_depth=4:mode=hq:format=nv12`);
    } else if (this.shouldScale(videoStream)) {
      options.push(`scale_qsv=${this.getScaling(videoStream)}:async_depth=4:mode=hq`);
    }
    options.push(...tonemapOptions);
    return options;
  }

  getToneMapping(videoStream: VideoStreamInfo): string[] {
    if (!this.shouldToneMap(videoStream)) {
      return [];
    }

    const { matrix, primaries, transfer } = this.getColors();
    const tonemapOptions = [
      'desat=0',
      'format=nv12',
      `matrix=${matrix}`,
      `primaries=${primaries}`,
      `transfer=${transfer}`,
      'range=pc',
      `tonemap=${this.config.tonemap}`,
      'tonemap_mode=lum',
      'peak=100',
    ];

    return [
      'hwmap=derive_device=opencl',
      `tonemap_opencl=${tonemapOptions.join(':')}`,
      'hwmap=derive_device=qsv:reverse=1,format=qsv',
    ];
  }

  getInputThreadOptions() {
    return ['-threads', '1'];
  }
}

export class VaapiSwDecodeConfig extends BaseHWConfig {
  getBaseInputOptions() {
    return ['-init_hw_device', `vaapi=accel:${this.device}`, '-filter_hw_device', 'accel'];
  }

  getFilterOptions(videoStream: VideoStreamInfo) {
    const options = this.getToneMapping(videoStream);
    options.push('hwupload=extra_hw_frames=64');
    if (this.shouldScale(videoStream)) {
      options.push(`scale_vaapi=${this.getScaling(videoStream)}:mode=hq:out_range=pc:format=nv12`);
    }

    return options;
  }

  getPresetOptions() {
    let presetIndex = this.getPresetIndex();
    if (presetIndex < 0) {
      return [];
    }
    presetIndex = Math.min(6, presetIndex) + 1; // 1 to 7
    return ['-compression_level', `${presetIndex}`];
  }

  getBitrateOptions() {
    const bitrates = this.getBitrateDistribution();
    const options = [];

    if (this.config.targetVideoCodec === VideoCodec.Vp9) {
      options.push('-bsf:v', 'vp9_raw_reorder,vp9_superframe');
    }

    // VAAPI doesn't allow setting both quality and max bitrate
    if (bitrates.max > 0) {
      options.push(
        '-b:v',
        `${bitrates.target}${bitrates.unit}`,
        '-maxrate',
        `${bitrates.max}${bitrates.unit}`,
        '-minrate',
        `${bitrates.min}${bitrates.unit}`,
        '-rc_mode',
        '3',
      ); // variable bitrate
    } else if (this.useCQP()) {
      options.push('-qp:v', `${this.config.crf}`, '-global_quality:v', `${this.config.crf}`, '-rc_mode', '1');
    } else {
      options.push('-global_quality:v', `${this.config.crf}`, '-rc_mode', '4');
    }

    return options;
  }

  useCQP() {
    return this.config.cqMode !== CQMode.Icq || this.config.targetVideoCodec === VideoCodec.Vp9;
  }

  getEncoderOptions(): string[] {
    const out = this.getOutputThreadOptions();
    if (this.tune.strictGop) {
      out.push('-idr_interval', '0');
    }
    return out;
  }
}

export class VaapiHwDecodeConfig extends VaapiSwDecodeConfig {
  getBaseInputOptions() {
    return [
      '-hwaccel',
      'vaapi',
      '-hwaccel_output_format',
      'vaapi',
      '-noautorotate',
      '-hwaccel_device',
      this.device,
      ...this.getInputThreadOptions(),
    ];
  }

  getFilterOptions(videoStream: VideoStreamInfo) {
    const options = [];
    const tonemapOptions = this.getToneMapping(videoStream);
    if (tonemapOptions.length === 0 && !videoStream.pixelFormat.endsWith('420p')) {
      options.push(`scale_vaapi=${this.getScaling(videoStream)}:mode=hq:out_range=pc:format=nv12`);
    } else if (this.shouldScale(videoStream)) {
      options.push(`scale_vaapi=${this.getScaling(videoStream)}:mode=hq:out_range=pc`);
    }
    options.push(...tonemapOptions);
    return options;
  }

  getToneMapping(videoStream: VideoStreamInfo): string[] {
    if (!this.shouldToneMap(videoStream)) {
      return [];
    }

    const { matrix, primaries, transfer } = this.getColors();
    const tonemapOptions = [
      'desat=0',
      'format=nv12',
      `matrix=${matrix}`,
      `primaries=${primaries}`,
      `transfer=${transfer}`,
      'range=pc',
      `tonemap=${this.config.tonemap}`,
      'tonemap_mode=lum',
      'peak=100',
    ];

    return [
      'hwmap=derive_device=opencl',
      `tonemap_opencl=${tonemapOptions.join(':')}`,
      'hwmap=derive_device=vaapi:reverse=1,format=vaapi',
    ];
  }

  getInputThreadOptions() {
    return ['-threads', '1'];
  }
}

export class RkmppSwDecodeConfig extends BaseHWConfig {
  eligibleForTwoPass(): boolean {
    return false;
  }

  getBaseInputOptions(): string[] {
    return [];
  }

  getPresetOptions() {
    switch (this.config.targetVideoCodec) {
      case VideoCodec.H264: {
        // from ffmpeg_mpp help, commonly referred to as H264 level 5.1
        return ['-level', '51'];
      }
      case VideoCodec.Hevc: {
        // from ffmpeg_mpp help, commonly referred to as HEVC level 5.1
        return ['-level', '153'];
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
      return ['-rc_mode', 'AVBR', '-b:v', `${bitrate}${this.getBitrateUnit()}`];
    }
    // use CRF value as QP value
    return ['-rc_mode', 'CQP', '-qp_init', `${this.config.crf}`];
  }

  getVideoCodec(): string {
    return `${this.config.targetVideoCodec}_rkmpp`;
  }
}

export class RkmppHwDecodeConfig extends RkmppSwDecodeConfig {
  getBaseInputOptions() {
    return ['-hwaccel', 'rkmpp', '-hwaccel_output_format', 'drm_prime', '-afbc', 'rga', '-noautorotate'];
  }

  getFilterOptions(videoStream: VideoStreamInfo) {
    if (this.shouldToneMap(videoStream)) {
      const { primaries, transfer, matrix } = this.getColors();
      if (this.interfaces.mali) {
        return [
          // use RKMPP for scaling, OpenCL for tone mapping
          `scale_rkrga=${this.getScaling(videoStream)}:format=p010:afbc=1:async_depth=4`,
          'hwmap=derive_device=opencl:mode=read',
          `tonemap_opencl=format=nv12:r=pc:p=${primaries}:t=${transfer}:m=${matrix}:tonemap=${this.config.tonemap}:desat=0:tonemap_mode=lum:peak=100`,
          'hwmap=derive_device=rkmpp:mode=write:reverse=1',
          'format=drm_prime',
        ];
      }
      return [
        // use RKMPP for scaling, CPU for tone mapping (only works on RK3588, which supports 10-bit output)
        `scale_rkrga=${this.getScaling(videoStream)}:format=p010:afbc=1:async_depth=4`,
        'hwdownload',
        'format=p010',
        `tonemapx=tonemap=${this.config.tonemap}:desat=0:p=${primaries}:t=${transfer}:m=${matrix}:r=pc:peak=100:format=yuv420p`,
        'hwupload',
      ];
    } else if (this.shouldScale(videoStream)) {
      return [`scale_rkrga=${this.getScaling(videoStream)}:format=nv12:afbc=1:async_depth=4`];
    }
    return [];
  }
}
