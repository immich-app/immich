export type Level = { videoCodec?: string; width: number; height: number; bitrate: number; frameRate: number };

export const DEFAULT_DECODING_INFO: MediaCapabilitiesDecodingInfo = {
  powerEfficient: true,
  smooth: true,
  supported: true,
  keySystemAccess: null,
};

class MediaCapabilitiesManager {
  private cache = new Map<string, Promise<MediaCapabilitiesDecodingInfo>>();

  init() {
    for (const level of [
      { videoCodec: 'av01.0.04M.08', width: 854, height: 480, bitrate: 1_000_000, frameRate: 60 },
      { videoCodec: 'hvc1.1.6.L90.B0', width: 854, height: 480, bitrate: 1_200_000, frameRate: 60 },
      { videoCodec: 'av01.0.08M.08', width: 1280, height: 720, bitrate: 2_000_000, frameRate: 60 },
      { videoCodec: 'hvc1.1.6.L93.B0', width: 1280, height: 720, bitrate: 2_500_000, frameRate: 60 },
      { videoCodec: 'av01.0.09M.08', width: 1920, height: 1080, bitrate: 4_000_000, frameRate: 60 },
      { videoCodec: 'hvc1.1.6.L120.B0', width: 1920, height: 1080, bitrate: 4_500_000, frameRate: 60 },
      { videoCodec: 'av01.0.12M.08', width: 2560, height: 1440, bitrate: 7_000_000, frameRate: 60 },
      { videoCodec: 'hvc1.2.4.L150.B0', width: 2560, height: 1440, bitrate: 8_000_000, frameRate: 60 },
    ]) {
      this.cache.set(this.cacheKey(level), this.queryDecodingInfo(level));
    }

    for (const level of [
      { videoCodec: 'avc1.64001e', width: 854, height: 480, bitrate: 2_500_000, frameRate: 60 },
      { videoCodec: 'avc1.64001f', width: 1280, height: 720, bitrate: 5_000_000, frameRate: 60 },
      { videoCodec: 'avc1.640028', width: 1920, height: 1080, bitrate: 8_000_000, frameRate: 60 },
      { videoCodec: 'avc1.640032', width: 2560, height: 1440, bitrate: 16_000_000, frameRate: 60 },
    ]) {
      this.cache.set(this.cacheKey(level), Promise.resolve(DEFAULT_DECODING_INFO));
    }
  }

  async efficientLevels(levels: Level[]) {
    const decodingInfo = await Promise.all(levels.map((level) => this.decodingInfo(level)));
    // eslint-disable-next-line svelte/prefer-svelte-reactivity
    const lowestBitrateByHeight = new Map<number, number>();
    for (let i = 0; i < levels.length; i++) {
      if (!decodingInfo[i].powerEfficient) {
        continue;
      }

      const { bitrate, height } = levels[i];
      const cur = lowestBitrateByHeight.get(height);
      if (cur === undefined || bitrate < levels[cur].bitrate) {
        lowestBitrateByHeight.set(height, i);
      }
    }

    return new Set(lowestBitrateByHeight.values());
  }

  decodingInfo(level: Level) {
    const key = this.cacheKey(level);
    const existing = this.cache.get(key);
    if (existing) {
      return existing;
    }
    const promise = this.queryDecodingInfo(level);
    this.cache.set(key, promise);
    return promise;
  }

  private async queryDecodingInfo(level: Level) {
    try {
      return await navigator.mediaCapabilities.decodingInfo({
        type: 'media-source',
        video: {
          contentType: `video/mp4; codecs="${level.videoCodec}"`,
          width: level.width,
          height: level.height,
          bitrate: level.bitrate,
          framerate: level.frameRate,
        },
      });
    } catch {
      return DEFAULT_DECODING_INFO;
    }
  }

  private cacheKey({ videoCodec, width, height, frameRate }: Level) {
    const resolution = Math.min(width, height);
    const fpsBucket = Math.trunc(frameRate / 61) * 60;
    return `${videoCodec}|${resolution}|${fpsBucket}`;
  }
}

export const mediaCapabilitiesManager = new MediaCapabilitiesManager();
// eslint-disable-next-line unicorn/no-top-level-side-effects
mediaCapabilitiesManager.init();
