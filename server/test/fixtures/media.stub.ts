import { ColorMatrix, ColorPrimaries, ColorTransfer, DvProfile, DvSignalCompatibility, VideoContainer } from 'src/enum';
import { AudioStreamInfo, VideoFormat, VideoInfo, VideoStreamInfo } from 'src/types';

const probeStubDefaultFormat: VideoFormat = {
  formatName: 'mov,mp4,m4a,3gp,3g2,mj2',
  formatLongName: 'QuickTime / MOV',
  duration: 0,
  bitrate: 0,
};

const probeStubDefaultVideoStream: VideoStreamInfo[] = [
  {
    index: 0,
    height: 1080,
    width: 1920,
    codecName: 'hevc',
    frameCount: 100,
    rotation: 0,
    bitrate: 0,
    colorPrimaries: ColorPrimaries.Bt709,
    colorTransfer: ColorTransfer.Bt709,
    colorMatrix: ColorMatrix.Bt709,
    pixelFormat: 'yuv420p',
    timeBase: 600,
  },
];

const probeStubDefaultAudioStream: AudioStreamInfo[] = [{ index: 3, codecName: 'mp3', bitrate: 100 }];

const probeStubDefault: VideoInfo = {
  format: probeStubDefaultFormat,
  videoStreams: probeStubDefaultVideoStream,
  audioStreams: probeStubDefaultAudioStream,
};

/** Fixtures in the shape `mediaRepository.probe()` returns (arrays of streams, raw ffprobe format). */
export const videoInfoStub = {
  noVideoStreams: Object.freeze<VideoInfo>({ ...probeStubDefault, videoStreams: [] }),
  noAudioStreams: Object.freeze<VideoInfo>({ ...probeStubDefault, audioStreams: [] }),
  multipleVideoStreams: Object.freeze<VideoInfo>({
    ...probeStubDefault,
    videoStreams: [
      {
        index: 0,
        height: 1080,
        width: 400,
        codecName: 'hevc',
        frameCount: 1,
        rotation: 0,
        bitrate: 100,
        colorPrimaries: ColorPrimaries.Bt709,
        colorTransfer: ColorTransfer.Bt709,
        colorMatrix: ColorMatrix.Bt709,
        pixelFormat: 'yuv420p',
        timeBase: 600,
      },
      {
        index: 1,
        height: 1080,
        width: 400,
        codecName: 'hevc',
        frameCount: 2,
        rotation: 0,
        bitrate: 101,
        colorPrimaries: ColorPrimaries.Bt709,
        colorTransfer: ColorTransfer.Bt709,
        colorMatrix: ColorMatrix.Bt709,
        pixelFormat: 'yuv420p',
        timeBase: 600,
      },
      {
        index: 2,
        height: 1080,
        width: 400,
        codecName: 'h7000',
        frameCount: 3,
        rotation: 0,
        bitrate: 99,
        colorPrimaries: ColorPrimaries.Bt709,
        colorTransfer: ColorTransfer.Bt709,
        colorMatrix: ColorMatrix.Bt709,
        pixelFormat: 'yuv420p',
        timeBase: 600,
      },
    ],
  }),
  multipleAudioStreams: Object.freeze<VideoInfo>({
    ...probeStubDefault,
    audioStreams: [
      { index: 0, codecName: 'mp3', bitrate: 100 },
      { index: 1, codecName: 'mp3', bitrate: 101 },
      { index: 2, codecName: 'mp3', bitrate: 102 },
    ],
  }),
  noHeight: Object.freeze<VideoInfo>({
    ...probeStubDefault,
    videoStreams: [
      {
        index: 0,
        height: 0,
        width: 400,
        codecName: 'hevc',
        frameCount: 100,
        rotation: 0,
        bitrate: 0,
        colorPrimaries: ColorPrimaries.Bt709,
        colorTransfer: ColorTransfer.Bt709,
        colorMatrix: ColorMatrix.Bt709,
        pixelFormat: 'yuv420p',
        timeBase: 600,
      },
    ],
  }),
  videoStream2160p: Object.freeze<VideoInfo>({
    ...probeStubDefault,
    videoStreams: [
      {
        index: 0,
        height: 2160,
        width: 3840,
        codecName: 'h264',
        frameCount: 100,
        rotation: 0,
        bitrate: 0,
        colorPrimaries: ColorPrimaries.Bt709,
        colorTransfer: ColorTransfer.Bt709,
        colorMatrix: ColorMatrix.Bt709,
        pixelFormat: 'yuv420p',
        timeBase: 600,
      },
    ],
  }),
  videoStream40Mbps: Object.freeze<VideoInfo>({
    ...probeStubDefault,
    videoStreams: [{ ...probeStubDefaultVideoStream[0], bitrate: 40_000_000, codecName: 'h264' }],
  }),
  videoStreamMTS: Object.freeze<VideoInfo>({
    ...probeStubDefault,
    format: {
      formatName: 'mpegts',
      formatLongName: 'MPEG-TS (MPEG-2 Transport Stream)',
      duration: 0,
      bitrate: 0,
    },
  }),
  videoStreamHDR: Object.freeze<VideoInfo>({
    ...probeStubDefault,
    videoStreams: [
      {
        index: 0,
        height: 480,
        width: 480,
        codecName: 'h264',
        frameCount: 100,
        rotation: 0,
        colorPrimaries: ColorPrimaries.Bt2020,
        colorMatrix: ColorMatrix.Bt2020Nc,
        colorTransfer: ColorTransfer.Smpte2084,
        bitrate: 0,
        pixelFormat: 'yuv420p10le',
        timeBase: 600,
      },
    ],
  }),
  videoStream10Bit: Object.freeze<VideoInfo>({
    ...probeStubDefault,
    videoStreams: [
      {
        index: 0,
        height: 480,
        width: 480,
        codecName: 'h264',
        frameCount: 100,
        rotation: 0,
        bitrate: 0,
        colorPrimaries: ColorPrimaries.Bt709,
        colorTransfer: ColorTransfer.Bt709,
        colorMatrix: ColorMatrix.Bt709,
        pixelFormat: 'yuv420p10le',
        timeBase: 600,
      },
    ],
  }),
  videoStream4K10Bit: Object.freeze<VideoInfo>({
    ...probeStubDefault,
    videoStreams: [
      {
        index: 0,
        height: 2160,
        width: 3840,
        codecName: 'h264',
        frameCount: 100,
        rotation: 0,
        bitrate: 0,
        colorPrimaries: ColorPrimaries.Bt709,
        colorTransfer: ColorTransfer.Bt709,
        colorMatrix: ColorMatrix.Bt709,
        pixelFormat: 'yuv420p10le',
        timeBase: 600,
      },
    ],
  }),
  videoStreamVertical2160p: Object.freeze<VideoInfo>({
    ...probeStubDefault,
    videoStreams: [
      {
        index: 0,
        height: 2160,
        width: 3840,
        codecName: 'h264',
        frameCount: 100,
        rotation: 90,
        bitrate: 0,
        colorPrimaries: ColorPrimaries.Bt709,
        colorTransfer: ColorTransfer.Bt709,
        colorMatrix: ColorMatrix.Bt709,
        pixelFormat: 'yuv420p',
        timeBase: 600,
      },
    ],
  }),
  videoStreamOddHeight: Object.freeze<VideoInfo>({
    ...probeStubDefault,
    videoStreams: [
      {
        index: 0,
        height: 355,
        width: 1586,
        codecName: 'h264',
        frameCount: 100,
        rotation: 0,
        bitrate: 0,
        colorPrimaries: ColorPrimaries.Bt709,
        colorTransfer: ColorTransfer.Bt709,
        colorMatrix: ColorMatrix.Bt709,
        pixelFormat: 'yuv420p',
        timeBase: 600,
      },
    ],
  }),
  videoStreamOddWidth: Object.freeze<VideoInfo>({
    ...probeStubDefault,
    videoStreams: [
      {
        index: 0,
        height: 1586,
        width: 355,
        codecName: 'h264',
        frameCount: 100,
        rotation: 0,
        bitrate: 0,
        colorPrimaries: ColorPrimaries.Bt709,
        colorTransfer: ColorTransfer.Bt709,
        colorMatrix: ColorMatrix.Bt709,
        pixelFormat: 'yuv420p',
        timeBase: 600,
      },
    ],
  }),
  audioStreamAac: Object.freeze<VideoInfo>({
    ...probeStubDefault,
    audioStreams: [{ index: 1, codecName: 'aac', bitrate: 100 }],
  }),
  audioStreamMp3: Object.freeze<VideoInfo>({
    ...probeStubDefault,
    audioStreams: [{ index: 1, codecName: 'mp3', bitrate: 100 }],
  }),
  audioStreamOpus: Object.freeze<VideoInfo>({
    ...probeStubDefault,
    audioStreams: [{ index: 1, codecName: 'opus', bitrate: 100 }],
  }),
  audioStreamUnknown: Object.freeze<VideoInfo>({
    ...probeStubDefault,
    audioStreams: [
      { index: 0, codecName: 'aac', bitrate: 100 },
      { index: 1, codecName: 'unknown', bitrate: 200 },
    ],
  }),
  matroskaContainer: Object.freeze<VideoInfo>({
    ...probeStubDefault,
    format: {
      formatName: 'matroska,webm',
      formatLongName: 'Matroska / WebM',
      duration: 0,
      bitrate: 0,
    },
  }),
  videoStreamVp9: Object.freeze<VideoInfo>({
    ...probeStubDefault,
    videoStreams: [{ ...probeStubDefaultVideoStream[0], codecName: 'vp9' }],
    format: {
      formatName: 'matroska,webm',
      formatLongName: 'Matroska / WebM',
      duration: 0,
      bitrate: 0,
    },
  }),
  videoStreamH264: Object.freeze<VideoInfo>({
    ...probeStubDefault,
    videoStreams: [{ ...probeStubDefaultVideoStream[0], codecName: 'h264' }],
  }),
  videoStreamAvi: Object.freeze<VideoInfo>({
    ...probeStubDefault,
    videoStreams: [{ ...probeStubDefaultVideoStream[0], codecName: 'h264' }],
    format: {
      formatName: 'avi',
      formatLongName: 'AVI (Audio Video Interleaved)',
      duration: 0,
      bitrate: 0,
    },
  }),
  videoStreamReserved: Object.freeze<VideoInfo>({
    ...probeStubDefault,
    videoStreams: [
      {
        ...probeStubDefaultVideoStream[0],
        colorPrimaries: ColorPrimaries.Reserved,
        colorMatrix: ColorMatrix.Reserved,
        colorTransfer: ColorTransfer.Reserved,
      },
    ],
  }),
  videoStreamHDR10: Object.freeze<VideoInfo>({
    ...probeStubDefault,
    videoStreams: [
      {
        index: 0,
        height: 2160,
        width: 3840,
        codecName: 'hevc',
        profile: 2,
        level: 153,
        frameCount: 1208,
        frameRate: 59.94,
        rotation: 0,
        bitrate: 64_000_000,
        pixelFormat: 'yuv420p10le',
        colorPrimaries: ColorPrimaries.Bt2020,
        colorMatrix: ColorMatrix.Bt2020Nc,
        colorTransfer: ColorTransfer.Smpte2084,
        timeBase: 600,
      },
    ],
  }),
  videoStreamDolbyVision: Object.freeze<VideoInfo>({
    ...probeStubDefault,
    videoStreams: [
      {
        index: 0,
        height: 2160,
        width: 3840,
        codecName: 'hevc',
        profile: 2,
        level: 153,
        frameCount: 1299,
        frameRate: 59.94,
        rotation: 0,
        bitrate: 53_500_000,
        pixelFormat: 'yuv420p10le',
        colorPrimaries: ColorPrimaries.Bt2020,
        colorMatrix: ColorMatrix.Bt2020Nc,
        colorTransfer: ColorTransfer.AribStdB67,
        dvProfile: DvProfile.Dvhe08,
        dvLevel: 10,
        dvBlSignalCompatibilityId: DvSignalCompatibility.Hlg,
        timeBase: 600,
      },
    ],
  }),
  videoStreamWithProfileLevel: Object.freeze<VideoInfo>({
    ...probeStubDefault,
    videoStreams: [
      {
        ...probeStubDefaultVideoStream[0],
        codecName: 'h264',
        profile: 100,
        level: 40,
      },
    ],
  }),
  audioStreamAAC: Object.freeze<VideoInfo>({
    ...probeStubDefault,
    audioStreams: [
      {
        index: 1,
        codecName: 'aac',
        profile: 2,
        bitrate: 128_000,
      },
    ],
  }),
};

/**
 * Fixtures in the shape `AssetJobRepository.getForVideoConversion` /
 * `getForGenerateThumbnailJob` return: a single `videoStream`/`audioStream` (the main one,
 * already picked) and a container name already mapped to a `VideoContainer` value.
 * Consumers spread these onto the mocked asset.
 */
interface VideoConversionStreams {
  videoStream: VideoStreamInfo | null;
  audioStream: AudioStreamInfo | null;
  format: VideoFormat | null;
}

const defaultMovFormat: VideoFormat = { formatName: VideoContainer.Mov, duration: 0, bitrate: 0 };
const defaultAudioStream: AudioStreamInfo = { index: 3, codecName: 'mp3', bitrate: 100 };
const defaultVideoStream: VideoStreamInfo = {
  index: 0,
  height: 1080,
  width: 1920,
  codecName: 'hevc',
  frameCount: 100,
  rotation: 0,
  bitrate: 0,
  colorPrimaries: ColorPrimaries.Bt709,
  colorTransfer: ColorTransfer.Bt709,
  colorMatrix: ColorMatrix.Bt709,
  pixelFormat: 'yuv420p',
  timeBase: 600,
};

export const probeStub = {
  multipleVideoStreams: {
    videoStream: { ...defaultVideoStream, index: 1, width: 400, frameCount: 2, bitrate: 101 },
    audioStream: defaultAudioStream,
    format: defaultMovFormat,
  },
  multipleAudioStreams: {
    videoStream: defaultVideoStream,
    audioStream: { index: 2, codecName: 'mp3', bitrate: 102 },
    format: defaultMovFormat,
  },
  noVideoStreams: { videoStream: null, audioStream: defaultAudioStream, format: defaultMovFormat },
  noAudioStreams: { videoStream: defaultVideoStream, audioStream: null, format: defaultMovFormat },
  noHeight: {
    videoStream: { ...defaultVideoStream, width: 400, height: 0 },
    audioStream: defaultAudioStream,
    format: defaultMovFormat,
  },
  videoStream2160p: {
    videoStream: { ...defaultVideoStream, height: 2160, width: 3840, codecName: 'h264' },
    audioStream: defaultAudioStream,
    format: defaultMovFormat,
  },
  videoStream40Mbps: {
    videoStream: { ...defaultVideoStream, bitrate: 40_000_000, codecName: 'h264' },
    audioStream: defaultAudioStream,
    format: defaultMovFormat,
  },
  videoStreamHDR: {
    videoStream: {
      ...defaultVideoStream,
      height: 480,
      width: 480,
      codecName: 'h264',
      colorPrimaries: ColorPrimaries.Bt2020,
      colorMatrix: ColorMatrix.Bt2020Nc,
      colorTransfer: ColorTransfer.Smpte2084,
      pixelFormat: 'yuv420p10le',
    },
    audioStream: defaultAudioStream,
    format: defaultMovFormat,
  },
  videoStream10Bit: {
    videoStream: { ...defaultVideoStream, height: 480, width: 480, codecName: 'h264', pixelFormat: 'yuv420p10le' },
    audioStream: defaultAudioStream,
    format: defaultMovFormat,
  },
  videoStream4K10Bit: {
    videoStream: {
      ...defaultVideoStream,
      height: 2160,
      width: 3840,
      codecName: 'h264',
      pixelFormat: 'yuv420p10le',
    },
    audioStream: defaultAudioStream,
    format: defaultMovFormat,
  },
  videoStreamVertical2160p: {
    videoStream: { ...defaultVideoStream, height: 2160, width: 3840, codecName: 'h264', rotation: 90 },
    audioStream: defaultAudioStream,
    format: defaultMovFormat,
  },
  videoStreamOddHeight: {
    videoStream: { ...defaultVideoStream, height: 355, width: 1586, codecName: 'h264' },
    audioStream: defaultAudioStream,
    format: defaultMovFormat,
  },
  videoStreamOddWidth: {
    videoStream: { ...defaultVideoStream, height: 1586, width: 355, codecName: 'h264' },
    audioStream: defaultAudioStream,
    format: defaultMovFormat,
  },
  videoStreamMTS: {
    videoStream: defaultVideoStream,
    audioStream: defaultAudioStream,
    format: { formatName: 'mpegts', duration: 0, bitrate: 0 },
  },
  videoStreamReserved: {
    videoStream: {
      ...defaultVideoStream,
      colorPrimaries: ColorPrimaries.Reserved,
      colorMatrix: ColorMatrix.Reserved,
      colorTransfer: ColorTransfer.Reserved,
    },
    audioStream: defaultAudioStream,
    format: defaultMovFormat,
  },
  videoStreamAvi: {
    videoStream: { ...defaultVideoStream, codecName: 'h264' },
    audioStream: defaultAudioStream,
    format: { formatName: 'avi', duration: 0, bitrate: 0 },
  },
  videoStreamVp9: {
    videoStream: { ...defaultVideoStream, codecName: 'vp9' },
    audioStream: defaultAudioStream,
    format: { formatName: VideoContainer.Webm, duration: 0, bitrate: 0 },
  },
  videoStreamH264: {
    videoStream: { ...defaultVideoStream, codecName: 'h264' },
    audioStream: defaultAudioStream,
    format: defaultMovFormat,
  },
  matroskaContainer: {
    videoStream: defaultVideoStream,
    audioStream: defaultAudioStream,
    format: { formatName: VideoContainer.Webm, duration: 0, bitrate: 0 },
  },
  audioStreamAac: {
    videoStream: defaultVideoStream,
    audioStream: { index: 1, codecName: 'aac', bitrate: 100 },
    format: defaultMovFormat,
  },
  audioStreamMp3: {
    videoStream: defaultVideoStream,
    audioStream: { index: 1, codecName: 'mp3', bitrate: 100 },
    format: defaultMovFormat,
  },
  audioStreamOpus: {
    videoStream: defaultVideoStream,
    audioStream: { index: 1, codecName: 'opus', bitrate: 100 },
    format: defaultMovFormat,
  },
  audioStreamUnknown: {
    videoStream: defaultVideoStream,
    audioStream: { index: 0, codecName: 'aac', bitrate: 100 },
    format: defaultMovFormat,
  },
} satisfies Record<string, VideoConversionStreams>;
