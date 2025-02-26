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
    isHDR: false,
    bitrate: 0,
    pixelFormat: 'yuv420p',
  },
];

const probeStubDefaultAudioStream: AudioStreamInfo[] = [{ index: 1, codecName: 'mp3', frameCount: 100 }];

const probeStubDefault: VideoInfo = {
  format: probeStubDefaultFormat,
  videoStreams: probeStubDefaultVideoStream,
  audioStreams: probeStubDefaultAudioStream,
};

export const probeStub = {
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
        frameCount: 100,
        rotation: 0,
        isHDR: false,
        bitrate: 0,
        pixelFormat: 'yuv420p',
      },
      {
        index: 1,
        height: 1080,
        width: 400,
        codecName: 'h7000',
        frameCount: 99,
        rotation: 0,
        isHDR: false,
        bitrate: 0,
        pixelFormat: 'yuv420p',
      },
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
        isHDR: false,
        bitrate: 0,
        pixelFormat: 'yuv420p',
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
        isHDR: false,
        bitrate: 0,
        pixelFormat: 'yuv420p',
      },
    ],
  }),
  videoStream40Mbps: Object.freeze<VideoInfo>({
    ...probeStubDefault,
    videoStreams: [{ ...probeStubDefaultVideoStream[0], bitrate: 40_000_000 }],
  }),
  videoStreamMTS: Object.freeze<VideoInfo>({
    ...probeStubDefault,
    format: {
      ...probeStubDefaultFormat,
      formatName: 'mpegts',
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
        isHDR: true,
        bitrate: 0,
        pixelFormat: 'yuv420p10le',
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
        isHDR: false,
        bitrate: 0,
        pixelFormat: 'yuv420p10le',
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
        isHDR: false,
        bitrate: 0,
        pixelFormat: 'yuv420p',
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
        isHDR: false,
        bitrate: 0,
        pixelFormat: 'yuv420p',
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
        isHDR: false,
        bitrate: 0,
        pixelFormat: 'yuv420p',
      },
    ],
  }),
  audioStreamAac: Object.freeze<VideoInfo>({
    ...probeStubDefault,
    audioStreams: [{ index: 1, codecName: 'aac', frameCount: 100 }],
  }),
  audioStreamUnknown: Object.freeze<VideoInfo>({
    ...probeStubDefault,
    audioStreams: [
      { index: 0, codecName: 'aac', frameCount: 100 },
      { index: 1, codecName: 'unknown', frameCount: 200 },
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
};
