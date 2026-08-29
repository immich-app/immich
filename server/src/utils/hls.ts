import { AUDIO_ENCODER } from 'src/constants';
import { AacProfile, AudioCodec, VideoCodec } from 'src/enum';
import { AudioStreamInfo, VideoPacketInfo, VideoStreamInfo } from 'src/types';

type HlsOriginalExtension = 'm4s' | 'ts';

export type HlsOriginalStream = {
  bitrate: number;
  codecs: string;
  durations: number[];
  extension: HlsOriginalExtension;
  targetDuration: number;
};

type HlsOriginalCommandOptions = {
  initFilename: string;
  inputPath: string;
  playlistFilename: string;
  segmentFilename: string;
};

const getVideoCodecString = (video: VideoStreamInfo) => {
  if (video.profile === null || video.level === null) {
    return;
  }
  if (video.codecName === VideoCodec.H264) {
    const profile = video.profile.toString(16).padStart(2, '0');
    const level = video.level.toString(16).padStart(2, '0');
    return `avc1.${profile}00${level}`;
  }
  if (video.codecName === VideoCodec.Hevc) {
    return `hvc1.${video.profile}.0.L${video.level}`;
  }
};

const getAudioCodecString = (audio: AudioStreamInfo | null) =>
  audio ? `mp4a.40.${audio.codecName === AudioCodec.Aac ? (audio.profile ?? AacProfile.Lc) : AacProfile.Lc}` : '';

const getOriginalExtension = (video: VideoStreamInfo): HlsOriginalExtension =>
  video.codecName === VideoCodec.H264 ? 'ts' : 'm4s';

const roundToNearestEven = (value: number) => {
  const lower = Math.floor(value);
  const fraction = value - lower;
  return fraction === 0.5 ? (lower % 2 === 0 ? lower : lower + 1) : Math.round(value);
};

export const getHlsOriginalStream = (
  video: VideoStreamInfo,
  audio: AudioStreamInfo | null,
  packets: VideoPacketInfo,
): HlsOriginalStream | null => {
  const videoCodec = getVideoCodecString(video);
  const count = packets.keyframePts.length;
  if (
    !videoCodec ||
    count === 0 ||
    packets.keyframeAccDuration.length !== count ||
    packets.keyframeOwnDuration.length !== count ||
    packets.keyframeAccDuration[0] !== packets.keyframeOwnDuration[0] ||
    !video.timeBase ||
    video.timeBase <= 0
  ) {
    return null;
  }

  const boundaryPts = packets.keyframePts;
  if (boundaryPts.some((pts, index) => !Number.isFinite(pts) || (index > 0 && pts <= boundaryPts[index - 1]))) {
    return null;
  }

  const durations = boundaryPts.slice(1).map((pts, index) => (pts - boundaryPts[index]) / video.timeBase!);
  const lastIndex = count - 1;
  durations.push(
    (packets.keyframeOwnDuration[0] + packets.totalDuration - packets.keyframeAccDuration[lastIndex]) / video.timeBase,
  );
  if (durations.some((duration) => !Number.isFinite(duration) || duration <= 0)) {
    return null;
  }

  const bitrate = video.bitrate + (audio?.bitrate ?? 0);
  if (!Number.isFinite(bitrate) || bitrate <= 0) {
    return null;
  }

  const audioCodec = getAudioCodecString(audio);
  return {
    bitrate,
    codecs: audioCodec ? `${videoCodec},${audioCodec}` : videoCodec,
    durations,
    extension: getOriginalExtension(video),
    targetDuration: roundToNearestEven(Math.max(...durations)),
  };
};

export const getHlsOriginalCommand = (
  options: HlsOriginalCommandOptions,
  video: VideoStreamInfo,
  audio: AudioStreamInfo | null,
) => {
  const args = ['-nostdin', '-nostats', '-i', options.inputPath, '-map', `0:${video.index}`, '-c:v', 'copy'];
  if (audio) {
    const copyAudio = audio.codecName === AudioCodec.Aac;
    args.push('-map', `0:${audio.index}`, '-c:a', copyAudio ? 'copy' : AUDIO_ENCODER[AudioCodec.Aac]);
    if (!copyAudio) {
      args.push('-ac', '2');
    }
  }
  if (video.codecName === VideoCodec.Hevc) {
    args.push('-tag:v', 'hvc1');
  }

  const extension = getOriginalExtension(video);
  args.push(
    '-copyts',
    '-avoid_negative_ts',
    'disabled',
    '-f',
    'hls',
    '-hls_time',
    '0',
    '-hls_list_size',
    '0',
    '-hls_playlist_type',
    'vod',
    '-hls_segment_type',
    extension === 'ts' ? 'mpegts' : 'fmp4',
  );
  if (extension === 'm4s') {
    args.push('-hls_fmp4_init_filename', options.initFilename);
  }
  args.push(
    '-hls_flags',
    'temp_file',
    '-hls_segment_filename',
    options.segmentFilename,
    '-start_number',
    '0',
    options.playlistFilename,
  );
  return args;
};
