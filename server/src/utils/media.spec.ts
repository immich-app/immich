import { defaults } from 'src/config';
import { SystemConfigFFmpegDto } from 'src/dtos/system-config.dto';
import { ColorTransfer, TranscodeHardwareAcceleration } from 'src/enum';
import { VideoInterfaces, VideoStreamInfo } from 'src/types';
import { VideoFrameExtractionConfig } from 'src/utils/media';
import { probeStub } from 'test/fixtures/media.stub';
import { describe, expect, it } from 'vitest';

const inputPath = '/original/asset.mp4';
const artifactPath = '/artifacts/asset.m4s';
const playlistPath = '/tmp/frames.m3u8';
const scoresPath = '/tmp/scores.txt';
const targetResolution = 640;
const qp = 34;

// Satisfies BaseHWConfig.validateDevices() (accepts renderD*/card* prefixes) and auto-resolves to
// /dev/dri/renderD128 since preferredHwDevice is 'auto'.
const videoInterfaces: VideoInterfaces = { dri: ['renderD128'], mali: false };

// 1920x1080, yuv420p, Bt709 (SDR), H.264 - see test/fixtures/media.stub.ts:379
const sdrVideoStream = probeStub.videoStreamH264.videoStream;

// Same stream, but with HDR10 color characteristics, to exercise the tonemap branches.
const hdrVideoStream: VideoStreamInfo = {
  ...sdrVideoStream,
  colorTransfer: ColorTransfer.Smpte2084,
  pixelFormat: 'yuv420p10le',
};

const hlsMuxerTail = [
  '-an',
  '-f',
  'hls',
  '-hls_segment_type',
  'fmp4',
  '-hls_flags',
  'single_file',
  '-hls_time',
  '0',
  '-hls_list_size',
  '0',
  '-hls_segment_filename',
  artifactPath,
  playlistPath,
  '-map',
  '[scored]',
  '-f',
  'null',
  '-',
];

const getExtractionCommand = (
  ffmpegOverrides: Partial<SystemConfigFFmpegDto>,
  videoStream: VideoStreamInfo = sdrVideoStream,
) => {
  const ffmpeg: SystemConfigFFmpegDto = { ...defaults.ffmpeg, ...ffmpegOverrides };
  const config = VideoFrameExtractionConfig.create({
    inputPath,
    artifactPath,
    playlistPath,
    scoresPath,
    targetResolution,
    qp,
    frameInterval: 1,
    ffmpeg,
    videoInterfaces,
  });
  return config.getExtractionCommand(videoStream);
};

describe('VideoFrameExtractionConfig', () => {
  describe('getExtractionCommand', () => {
    it('builds the SW (CPU) command when hardware acceleration is disabled', () => {
      const args = getExtractionCommand({ accel: TranscodeHardwareAcceleration.Disabled });

      expect(args).toEqual([
        '-nostdin',
        '-nostats',
        '-v',
        'verbose',
        '-noautorotate',
        '-i',
        inputPath,
        '-filter_complex',
        `[0:v]scale=1138:640,fps=1,split[enc][an];[an]scdet=threshold=100,metadata=print:file=${scoresPath}[scored]`,
        '-map',
        '[enc]',
        '-c:v',
        'libx264',
        '-g',
        '1',
        '-qp',
        '34',
        '-bf',
        '0',
        ...hlsMuxerTail,
      ]);
    });

    it('builds the VAAPI command with hardware decoding', () => {
      const args = getExtractionCommand({ accel: TranscodeHardwareAcceleration.Vaapi, accelDecode: true });

      expect(args).toEqual([
        '-nostdin',
        '-nostats',
        '-v',
        'verbose',
        '-hwaccel',
        'vaapi',
        '-hwaccel_output_format',
        'vaapi',
        '-noautorotate',
        '-hwaccel_device',
        '/dev/dri/renderD128',
        '-threads',
        '1',
        '-i',
        inputPath,
        '-filter_complex',
        `[0:v]scale_vaapi=-2:640:mode=hq:out_range=pc,fps=1,split[enc][an];[an]hwdownload,format=nv12,scdet=threshold=100,metadata=print:file=${scoresPath}[scored]`,
        '-map',
        '[enc]',
        '-c:v',
        'h264_vaapi',
        '-g',
        '1',
        '-bf',
        '0',
        '-qp:v',
        '34',
        '-global_quality:v',
        '34',
        '-rc_mode',
        '1',
        '-idr_interval',
        '0',
        '-low_power',
        '1',
        ...hlsMuxerTail,
      ]);
    });

    it('builds the VAAPI command with software decoding', () => {
      const args = getExtractionCommand({ accel: TranscodeHardwareAcceleration.Vaapi, accelDecode: false });

      expect(args).toEqual([
        '-nostdin',
        '-nostats',
        '-v',
        'verbose',
        '-init_hw_device',
        'vaapi=accel:/dev/dri/renderD128',
        '-filter_hw_device',
        'accel',
        '-i',
        inputPath,
        '-filter_complex',
        `[0:v]hwupload=extra_hw_frames=64,scale_vaapi=-2:640:mode=hq:out_range=pc:format=nv12,fps=1,split[enc][an];[an]hwdownload,format=nv12,scdet=threshold=100,metadata=print:file=${scoresPath}[scored]`,
        '-map',
        '[enc]',
        '-c:v',
        'h264_vaapi',
        '-g',
        '1',
        '-bf',
        '0',
        '-qp:v',
        '34',
        '-global_quality:v',
        '34',
        '-rc_mode',
        '1',
        '-idr_interval',
        '0',
        '-low_power',
        '1',
        ...hlsMuxerTail,
      ]);
    });

    it('builds the QSV command with hardware decoding', () => {
      const args = getExtractionCommand({ accel: TranscodeHardwareAcceleration.Qsv, accelDecode: true });

      expect(args).toEqual([
        '-nostdin',
        '-nostats',
        '-v',
        'verbose',
        '-hwaccel',
        'qsv',
        '-hwaccel_output_format',
        'qsv',
        '-async_depth',
        '4',
        '-noautorotate',
        '-qsv_device',
        '/dev/dri/renderD128',
        '-threads',
        '1',
        '-i',
        inputPath,
        '-filter_complex',
        `[0:v]scale_qsv=-1:640:async_depth=4:mode=hq,fps=1,split[enc][an];[an]hwdownload,format=nv12,scdet=threshold=100,metadata=print:file=${scoresPath}[scored]`,
        '-map',
        '[enc]',
        '-c:v',
        'h264_qsv',
        '-g',
        '1',
        '-bf',
        '0',
        '-q:v',
        '34',
        '-idr_interval',
        '0',
        '-low_power',
        '1',
        ...hlsMuxerTail,
      ]);
    });

    it('builds the QSV command with software decoding', () => {
      const args = getExtractionCommand({ accel: TranscodeHardwareAcceleration.Qsv, accelDecode: false });

      expect(args).toEqual([
        '-nostdin',
        '-nostats',
        '-v',
        'verbose',
        '-init_hw_device',
        'qsv=hw,child_device=/dev/dri/renderD128',
        '-filter_hw_device',
        'hw',
        '-i',
        inputPath,
        '-filter_complex',
        `[0:v]hwupload=extra_hw_frames=64,scale_qsv=-1:640:mode=hq:format=nv12,fps=1,split[enc][an];[an]hwdownload,format=nv12,scdet=threshold=100,metadata=print:file=${scoresPath}[scored]`,
        '-map',
        '[enc]',
        '-c:v',
        'h264_qsv',
        '-g',
        '1',
        '-bf',
        '0',
        '-q:v',
        '34',
        '-idr_interval',
        '0',
        '-low_power',
        '1',
        ...hlsMuxerTail,
      ]);
    });

    it('builds the NVENC command with hardware decoding, without -low_power (VAAPI/QSV-only flag)', () => {
      const args = getExtractionCommand({ accel: TranscodeHardwareAcceleration.Nvenc, accelDecode: true });

      expect(args).toEqual([
        '-nostdin',
        '-nostats',
        '-v',
        'verbose',
        '-hwaccel',
        'cuda',
        '-hwaccel_output_format',
        'cuda',
        '-noautorotate',
        '-threads',
        '1',
        '-i',
        inputPath,
        '-filter_complex',
        `[0:v]scale_cuda=-2:640:format=nv12,fps=1,split[enc][an];[an]hwdownload,format=nv12,scdet=threshold=100,metadata=print:file=${scoresPath}[scored]`,
        '-map',
        '[enc]',
        '-c:v',
        'h264_nvenc',
        '-g',
        '1',
        '-bf',
        '0',
        '-cq:v',
        '34',
        '-forced-idr',
        '1',
        ...hlsMuxerTail,
      ]);
    });

    it('builds the NVENC command with software decoding, without -low_power (VAAPI/QSV-only flag)', () => {
      const args = getExtractionCommand({ accel: TranscodeHardwareAcceleration.Nvenc, accelDecode: false });

      expect(args).toEqual([
        '-nostdin',
        '-nostats',
        '-v',
        'verbose',
        '-init_hw_device',
        'cuda=cuda:0',
        '-filter_hw_device',
        'cuda',
        '-i',
        inputPath,
        '-filter_complex',
        `[0:v]hwupload_cuda,scale_cuda=-2:640:format=nv12,fps=1,split[enc][an];[an]hwdownload,format=nv12,scdet=threshold=100,metadata=print:file=${scoresPath}[scored]`,
        '-map',
        '[enc]',
        '-c:v',
        'h264_nvenc',
        '-g',
        '1',
        '-bf',
        '0',
        '-cq:v',
        '34',
        '-forced-idr',
        '1',
        ...hlsMuxerTail,
      ]);
    });

    it('builds the RKMPP command with hardware decoding, without an IDR flag or -low_power', () => {
      const args = getExtractionCommand({ accel: TranscodeHardwareAcceleration.Rkmpp, accelDecode: true });

      expect(args).toEqual([
        '-nostdin',
        '-nostats',
        '-v',
        'verbose',
        '-hwaccel',
        'rkmpp',
        '-hwaccel_output_format',
        'drm_prime',
        '-afbc',
        'rga',
        '-noautorotate',
        '-i',
        inputPath,
        '-filter_complex',
        `[0:v]scale_rkrga=-2:640:format=nv12:afbc=1:async_depth=4,fps=1,split[enc][an];[an]hwdownload,format=nv12,scdet=threshold=100,metadata=print:file=${scoresPath}[scored]`,
        '-map',
        '[enc]',
        '-c:v',
        'h264_rkmpp',
        '-g',
        '1',
        '-bf',
        '0',
        '-rc_mode',
        'CQP',
        '-qp_init',
        '34',
        ...hlsMuxerTail,
      ]);
    });

    it('builds the VAAPI command with a tonemap filter chain for HDR source content', () => {
      const args = getExtractionCommand(
        { accel: TranscodeHardwareAcceleration.Vaapi, accelDecode: true },
        hdrVideoStream,
      );

      expect(args).toEqual([
        '-nostdin',
        '-nostats',
        '-v',
        'verbose',
        '-hwaccel',
        'vaapi',
        '-hwaccel_output_format',
        'vaapi',
        '-noautorotate',
        '-hwaccel_device',
        '/dev/dri/renderD128',
        '-threads',
        '1',
        '-i',
        inputPath,
        '-filter_complex',
        '[0:v]scale_vaapi=-2:640:mode=hq:out_range=pc,hwmap=derive_device=opencl,' +
          'tonemap_opencl=desat=0:format=nv12:matrix=bt709:primaries=bt709:transfer=bt709:range=pc:tonemap=hable:tonemap_mode=lum:peak=100,' +
          `hwmap=derive_device=vaapi:reverse=1,format=vaapi,fps=1,split[enc][an];[an]hwdownload,format=nv12,scdet=threshold=100,metadata=print:file=${scoresPath}[scored]`,
        '-map',
        '[enc]',
        '-c:v',
        'h264_vaapi',
        '-g',
        '1',
        '-bf',
        '0',
        '-qp:v',
        '34',
        '-global_quality:v',
        '34',
        '-rc_mode',
        '1',
        '-idr_interval',
        '0',
        '-low_power',
        '1',
        ...hlsMuxerTail,
      ]);
    });

    it('builds the NVENC command with a single tonemap_cuda filter for HDR source content', () => {
      const args = getExtractionCommand(
        { accel: TranscodeHardwareAcceleration.Nvenc, accelDecode: true },
        hdrVideoStream,
      );

      expect(args).toEqual([
        '-nostdin',
        '-nostats',
        '-v',
        'verbose',
        '-hwaccel',
        'cuda',
        '-hwaccel_output_format',
        'cuda',
        '-noautorotate',
        '-threads',
        '1',
        '-i',
        inputPath,
        '-filter_complex',
        '[0:v]scale_cuda=-2:640,tonemap_cuda=desat=0:matrix=bt709:primaries=bt709:range=pc:tonemap=hable:tonemap_mode=lum:transfer=bt709:peak=100:format=nv12,' +
          `fps=1,split[enc][an];[an]hwdownload,format=nv12,scdet=threshold=100,metadata=print:file=${scoresPath}[scored]`,
        '-map',
        '[enc]',
        '-c:v',
        'h264_nvenc',
        '-g',
        '1',
        '-bf',
        '0',
        '-cq:v',
        '34',
        '-forced-idr',
        '1',
        ...hlsMuxerTail,
      ]);
    });
  });
});
