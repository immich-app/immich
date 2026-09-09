import { AacProfile, AudioCodec, ColorTransfer, DvSignalCompatibility, HevcProfile, VideoCodec } from 'src/enum';
import { AudioStreamInfo, VideoPacketInfo, VideoStreamInfo } from 'src/types';

type VideoRange = 'SDR' | 'PQ' | 'HLG';

export type HlsOriginalStream = {
  bitrate: number;
  codecs: string;
  durations: number[];
  supplementalCodecs?: string;
  targetDuration: number;
  videoRange: VideoRange;
};

// Backward-compatible Dolby Vision advertises its base layer in CODECS and its own profile in SUPPLEMENTAL-CODECS
const DV_COMPATIBILITY: Partial<Record<DvSignalCompatibility, { brand?: string; videoRange: VideoRange }>> = {
  [DvSignalCompatibility.Hdr10]: { brand: 'db1p', videoRange: 'PQ' },
  [DvSignalCompatibility.Sdr709]: { brand: 'db2g', videoRange: 'SDR' },
  [DvSignalCompatibility.Hlg]: { brand: 'db4h', videoRange: 'HLG' },
  [DvSignalCompatibility.Sdr2020]: { videoRange: 'SDR' },
};

const pad2 = (value: number) => value.toString().padStart(2, '0');

const getDolbyVisionCompatibility = (video: VideoStreamInfo) =>
  video.dvBlSignalCompatibilityId === null ? undefined : DV_COMPATIBILITY[video.dvBlSignalCompatibilityId];

// Backward-compatible Dolby Vision keeps the hvc1 sample entry of its base layer and announces itself in SUPPLEMENTAL-CODECS
export const isDolbyVisionCompatible = (video: VideoStreamInfo) =>
  getDolbyVisionCompatibility(video)?.brand !== undefined;

const getBaseCodecString = (video: VideoStreamInfo) => {
  if (video.profile === null || video.level === null) {
    return;
  }
  switch (video.codecName) {
    case VideoCodec.H264: {
      return `avc1.${video.profile.toString(16).padStart(2, '0')}00${video.level.toString(16).padStart(2, '0')}`;
    }
    case VideoCodec.Hevc: {
      // Profile compatibility flags are written in reverse bit order; Main streams also satisfy Main 10 decoders
      const compatibility = video.profile === HevcProfile.Main ? 6 : 1 << video.profile;
      return `hvc1.${video.profile}.${compatibility.toString(16)}.L${video.level}.B0`;
    }
    case VideoCodec.Av1: {
      const bitDepth = video.pixelFormat.includes('12') ? 12 : video.pixelFormat.includes('10') ? 10 : 8;
      return `av01.${video.profile}.${pad2(video.level)}M.${pad2(bitDepth)}`;
    }
    default: {
      return;
    }
  }
};

const getVideoCodecStrings = (video: VideoStreamInfo) => {
  const codecs = getBaseCodecString(video);
  // Dolby Vision is only described for HEVC, which is what phones record; other Dolby Vision streams play as their base layer
  if (video.codecName !== VideoCodec.Hevc || video.dvProfile === null || video.dvLevel === null) {
    return codecs ? { codecs } : undefined;
  }
  const dolbyVision = `dvh1.${pad2(video.dvProfile)}.${pad2(video.dvLevel)}`;
  const brand = getDolbyVisionCompatibility(video)?.brand;
  return codecs && brand ? { codecs, supplementalCodecs: `${dolbyVision}/${brand}` } : { codecs: dolbyVision };
};

const getAudioCodecString = (audio: AudioStreamInfo | null) =>
  audio ? `mp4a.40.${audio.codecName === AudioCodec.Aac ? (audio.profile ?? AacProfile.Lc) : AacProfile.Lc}` : '';

const getVideoRange = (video: VideoStreamInfo): VideoRange => {
  const dolbyVisionRange = getDolbyVisionCompatibility(video)?.videoRange;
  if (dolbyVisionRange) {
    return dolbyVisionRange;
  }
  if (video.colorTransfer === ColorTransfer.AribStdB67) {
    return 'HLG';
  }
  // Dolby Vision without a compatible base layer is PQ-based
  return video.colorTransfer === ColorTransfer.Smpte2084 || video.dvProfile !== null ? 'PQ' : 'SDR';
};

export const getHlsOriginalStream = (
  video: VideoStreamInfo,
  audio: AudioStreamInfo | null,
  packets: VideoPacketInfo,
): HlsOriginalStream | null => {
  const videoCodecs = getVideoCodecStrings(video);
  const bitrate = video.bitrate + (audio?.bitrate ?? 0);
  const { keyframePts, keyframeAccDuration, keyframeOwnDuration, totalDuration } = packets;
  const timeBase = video.timeBase;
  // hlsenc takes the first packet as the first keyframe, so the stream has to start with one
  if (
    !videoCodecs ||
    bitrate <= 0 ||
    !timeBase ||
    keyframePts.length === 0 ||
    keyframeAccDuration[0] !== keyframeOwnDuration[0]
  ) {
    return null;
  }

  // hlsenc closes a segment at the PTS of the next keyframe. The last segment is the durations of the packets
  // following the last keyframe plus the duration of the first packet it ever muxed, which stands in for the keyframe.
  const durations = keyframePts.slice(1).map((pts, index) => (pts - keyframePts[index]) / timeBase);
  durations.push((keyframeOwnDuration[0] + totalDuration - keyframeAccDuration[keyframePts.length - 1]) / timeBase);
  if (durations.some((duration) => duration <= 0)) {
    return null;
  }

  const audioCodec = getAudioCodecString(audio);
  return {
    bitrate,
    codecs: audioCodec ? `${videoCodecs.codecs},${audioCodec}` : videoCodecs.codecs,
    durations,
    supplementalCodecs: videoCodecs.supplementalCodecs,
    targetDuration: Math.round(Math.max(...durations)),
    videoRange: getVideoRange(video),
  };
};
