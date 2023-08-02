import { AudioStreamInfo, VideoFormat, VideoInfo, VideoStreamInfo } from '@app/domain';

const probeStubDefaultFormat: VideoFormat = {
  formatName: 'mov,mp4,m4a,3gp,3g2,mj2',
  formatLongName: 'QuickTime / MOV',
  duration: 0,
};

const probeStubDefaultVideoStream: VideoStreamInfo[] = [
  { height: 1080, width: 1920, codecName: 'hevc', codecType: 'video', frameCount: 100, rotation: 0, isHDR: false },
];

const probeStubDefaultAudioStream: AudioStreamInfo[] = [{ codecName: 'aac', codecType: 'audio' }];

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
        height: 1080,
        width: 400,
        codecName: 'hevc',
        codecType: 'video',
        frameCount: 100,
        rotation: 0,
        isHDR: false,
      },
      {
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
  videoStreamHDR: Object.freeze<VideoInfo>({
    ...probeStubDefault,
    videoStreams: [
      {
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
  audioStreamMp3: Object.freeze<VideoInfo>({
    ...probeStubDefault,
    audioStreams: [{ codecType: 'audio', codecName: 'aac' }],
  }),
  matroskaContainer: Object.freeze<VideoInfo>({
    ...probeStubDefault,
    format: {
      formatName: 'matroska,webm',
      formatLongName: 'Matroska / WebM',
      duration: 0,
    },
  }),
};
