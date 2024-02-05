import { AudioStreamInfo, VideoFormat, VideoInfo, VideoStreamInfo } from '@app/domain';

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
    codecType: 'video',
    frameCount: 100,
    rotation: 0,
    isHDR: false,
  },
];

const probeStubDefaultAudioStream: AudioStreamInfo[] = [
  { index: 1, codecName: 'aac', codecType: 'audio', frameCount: 100 },
];

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
        codecType: 'video',
        frameCount: 100,
        rotation: 0,
        isHDR: false,
      },
      {
        index: 1,
        height: 1080,
        width: 400,
        codecName: 'h7000',
        codecType: 'video',
        frameCount: 99,
        rotation: 0,
        isHDR: false,
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
        codecType: 'video',
        frameCount: 100,
        rotation: 0,
        isHDR: false,
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
        codecType: 'video',
        frameCount: 100,
        rotation: 0,
        isHDR: false,
      },
    ],
  }),
  videoStream40Mbps: Object.freeze<VideoInfo>({
    ...probeStubDefault,
    format: {
      formatName: 'mov,mp4,m4a,3gp,3g2,mj2',
      formatLongName: 'QuickTime / MOV',
      duration: 0,
      bitrate: 40_000_000,
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
        codecType: 'video',
        frameCount: 100,
        rotation: 0,
        isHDR: true,
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
        codecType: 'video',
        frameCount: 100,
        rotation: 90,
        isHDR: false,
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
        codecType: 'video',
        frameCount: 100,
        rotation: 0,
        isHDR: false,
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
        codecType: 'video',
        frameCount: 100,
        rotation: 0,
        isHDR: false,
      },
    ],
  }),
  audioStreamMp3: Object.freeze<VideoInfo>({
    ...probeStubDefault,
    audioStreams: [{ index: 1, codecType: 'audio', codecName: 'aac', frameCount: 100 }],
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
};
