import Hls, {
  AbrController,
  Events,
  FetchLoader,
  type FragLoadedData,
  type FragLoadingData,
  type HlsConfig,
} from 'hls.js';
import { debounce } from 'lodash-es';
import { mediaCapabilitiesManager } from '$lib/managers/media-capabilities-manager.svelte';
import { getAssetHlsSessionUrl } from '$lib/utils';

const HLS_TARGET_SEGMENT_HEADER = 'x-immich-hls-msn';
const RESIZE_FLUSH_DEBOUNCE_MS = 150;
const SESSION_ID_REGEX = /\/video\/stream\/([0-9a-f-]{36})\//;

// hls.js can abandon fetching an in-flight fragment if it thinks it'll take too long, in which case
// it emergency switches to a different variant. This extends the delay even further due to
// cold starting another transcode, so let the fragment finish and have steady ABR decide the next level.
//
// It can also emergency switch between fragments: while a switch's first segment is still loading,
// it can run out of buffer and drop to a lower level for just one segment before continuing at the switched quality.
// This can cause multiple redundant transcoding restarts when it occurs.
// Hold the committed level until its first fragment lands, then resume normal ABR.
export class NoAbandonAbrController extends AbrController {
  private switchTarget = -1;

  protected override onFragLoading(_event: Events.FRAG_LOADING, data: FragLoadingData) {
    if (data.frag.sn === 'initSegment') {
      this.switchTarget = data.frag.level;
    }
  }

  protected override onFragLoaded(event: Events.FRAG_LOADED, data: FragLoadedData) {
    if (data.frag.sn !== 'initSegment') {
      this.switchTarget = -1;
    }
    super.onFragLoaded(event, data);
  }

  override get nextAutoLevel(): number {
    const level = super.nextAutoLevel;
    const target = this.hls.levels[this.switchTarget];
    // Hold the committed level, but only while hls.js still considers it healthy.
    if (target && level < this.switchTarget && target.loadError === 0 && target.fragmentError === 0) {
      return this.switchTarget;
    }
    return level;
  }

  override set nextAutoLevel(level: number) {
    super.nextAutoLevel = level;
  }
}

// hls.js flushes the forward buffer on a level switch so the new variant surfaces quickly, but requests can happen
// out of order and cause unnecessary transcodes since it leaves the loader running during the flush.
// This version stops the loader until the buffer is flushed so segment requests stay monotonic.
class FlushAheadStreamController extends Hls.DefaultConfig.streamController {
  #flushPending = false;
  #flushAhead = debounce(() => this.#switchAhead(), RESIZE_FLUSH_DEBOUNCE_MS);

  override nextLevelSwitch() {
    this.#flushAhead();
  }

  #switchAhead() {
    const { media, hls, levels, playlistType } = this;
    if (!media?.readyState || !levels || this.#flushPending) {
      return;
    }
    const bufferInfo = this.getFwdBufferInfo(this.getBufferOutput(), playlistType);
    const nextLevel = levels[hls.nextLoadLevel];
    if (!bufferInfo || !nextLevel) {
      return;
    }
    const { fetchdelay, okToFlushForwardBuffer } = this.calculateOptimalSwitchPoint(nextLevel, bufferInfo);
    const flushFrom = this.playhead + fetchdelay;
    if (!okToFlushForwardBuffer || bufferInfo.end <= flushFrom) {
      return;
    }
    this.#flushPending = true;
    hls.stopLoad();
    hls.once(Events.BUFFER_FLUSHED, () => {
      this.#flushPending = false;
      hls.startLoad();
    });
    hls.trigger(Events.BUFFER_FLUSHING, {
      startOffset: flushFrom,
      endOffset: Number.POSITIVE_INFINITY,
      type: null,
    });
  }
}

export const createHls = (overrides?: Partial<HlsConfig>): Hls => {
  const hls = new Hls({
    abrController: NoAbandonAbrController,
    loader: FetchLoader,
    capLevelToPlayerSize: true,
    streamController: FlushAheadStreamController,
    testBandwidth: false,
    highBufferWatchdogPeriod: 10,
    detectStallWithCurrentTimeMs: 10_000,
    maxBufferHole: 0.5,
    maxBufferLength: 30,
    maxMaxBufferLength: 60,
    fragLoadPolicy: {
      default: {
        maxTimeToFirstByteMs: 30_000,
        maxLoadTimeMs: 60_000,
        timeoutRetry: { maxNumRetry: 5, retryDelayMs: 100, maxRetryDelayMs: 0 },
        errorRetry: { maxNumRetry: 3, retryDelayMs: 1000, maxRetryDelayMs: 8000 },
      },
    },
    useMediaCapabilities: false,
    ...overrides,
  });

  // init.mp4 carries no segment number, but the server needs to know which segment an init.mp4
  // is for so it can start the transcode there. It sometimes can't infer this since segments can
  // be loaded from browser cache and the server might not know where the client really is as a result.
  // Let the client hint the target segment it's switching to with a custom header.
  hls.config.fetchSetup = (context, initParams) => {
    const frag = (context as { frag?: { sn: number | 'initSegment' } }).frag;
    if (frag?.sn === 'initSegment') {
      const sn = hls.inFlightFragments.main.frag?.sn;
      if (typeof sn === 'number') {
        (initParams.headers as Headers).set(HLS_TARGET_SEGMENT_HEADER, String(sn));
      }
    }
    return new Request(context.url, initParams);
  };

  return hls;
};

export const getHlsSessionId = (api: Hls): string | undefined => {
  return api.levels[0]?.url[0]?.match(SESSION_ID_REGEX)?.[1];
};

export const releaseHlsSession = (assetId: string, sessionId: string) => {
  const url = getAssetHlsSessionUrl(assetId, sessionId);
  void fetch(url, { method: 'DELETE' }).catch(() =>
    console.warn('Failed to release HLS session', { assetId, sessionId }),
  );
};

/** Drop every variant the browser can't hardware-decode efficiently, keeping one per resolution. */
export const filterEfficientLevels = async (api: Hls) => {
  const keep = await mediaCapabilitiesManager.efficientLevels(api.levels);
  for (let i = api.levels.length - 1; i >= 0; i--) {
    if (!keep.has(i)) {
      api.removeLevel(i);
    }
  }
};
