import { AssetMediaSize } from '@immich/sdk';
import Hls, { type ErrorData, type Level } from 'hls.js';
import { featureFlagsManager } from '$lib/managers/feature-flags-manager.svelte';
import { getAssetHlsUrl, getAssetMediaUrl, getAssetPlaybackUrl } from '$lib/utils';
import { createHls, filterEfficientLevels, getHlsSessionId, releaseHlsSession } from '$lib/utils/video/hls';

export interface VideoControllerOptions {
  assetId: string;
  cacheKey: string | null;
  playOriginal: boolean;
}

const HLS_MIME = 'application/x-mpegURL';
const MAX_REBUILDS = 1;

/**
 * Owns a single, long-lived `<video>` for an asset and all of its playback wiring.
 * Because the controller owns the element, hosts can {@link mount} it and hand it off by re-parenting, enabling
 * bandwidth estimation, buffer, HLS session, playback position, etc. to survive.
 */
export class VideoController {
  readonly element: HTMLVideoElement;

  loading = $state(true);
  error = $state(false);
  currentTime = $state(0);
  duration = $state(0);
  levels = $state<Level[]>([]);
  selectedLevel = $state(-1);

  private assetId: string;
  private cacheKey: string | null;
  private api: Hls | undefined;
  private sourceTeardown: (() => void) | undefined;
  private started = false;
  private wasPlaying = false;
  private rebuilds = 0;

  #level = $state(-1);
  #playOriginal: boolean;

  constructor({ assetId, cacheKey, playOriginal }: VideoControllerOptions) {
    this.assetId = assetId;
    this.cacheKey = cacheKey;
    this.#playOriginal = playOriginal;

    const element = document.createElement('video');
    element.playsInline = true;
    element.disablePictureInPicture = true;
    element.addEventListener('play', () => {
      this.loading = false;
      this.error = false;
    });
    element.addEventListener('error', () => {
      this.error = true;
      this.loading = false;
    });
    element.addEventListener('timeupdate', () => {
      this.currentTime = element.currentTime;
      this.duration = element.duration;
    });
    this.element = element;
  }

  mount(container: HTMLElement) {
    container.append(this.element);
    if (!this.started) {
      this.started = true;
      const useHls = featureFlagsManager.value.realtimeTranscoding && !this.#playOriginal;
      this.sourceTeardown = useHls ? this.attachHls() : this.attachProgressive();
    } else if (this.wasPlaying) {
      void this.element.play().catch(() => {});
    }
  }

  unmount(container: HTMLElement) {
    if (this.element.parentElement === container) {
      this.wasPlaying = !this.element.paused;
      this.element.remove();
    }
  }

  release() {
    this.sourceTeardown?.();
    this.sourceTeardown = undefined;
    this.element.remove();
  }

  get remainingSeconds() {
    return Math.max(0, this.duration - this.currentTime);
  }

  set playOriginal(playOriginal: boolean) {
    if (this.#playOriginal === playOriginal) {
      return;
    }
    this.#playOriginal = playOriginal;
    if (!this.started) {
      return;
    }
    this.sourceTeardown?.();
    const useHls = featureFlagsManager.value.realtimeTranscoding && !playOriginal;
    this.sourceTeardown = useHls ? this.attachHls() : this.attachProgressive();
  }

  get level() {
    return this.#level;
  }

  set level(index: number) {
    if (!this.api) {
      return;
    }
    // -1 re-enables ABR without flushing
    if (index === -1) {
      this.api.loadLevel = -1;
    } else {
      this.api.currentLevel = index;
    }
    this.selectedLevel = index;
  }

  private attachProgressive() {
    this.element.src = this.#playOriginal
      ? getAssetMediaUrl({ id: this.assetId, size: AssetMediaSize.Original, cacheKey: this.cacheKey })
      : getAssetPlaybackUrl({ id: this.assetId, cacheKey: this.cacheKey });
    return () => this.detachSource();
  }

  private detachSource() {
    this.element.pause();
    this.element.removeAttribute('src');
    this.element.load();
  }

  private attachHls(startPosition = -1): () => void {
    const video = this.element;
    // Old iOS versions don't support Media Source Extensions
    if (!Hls.isSupported()) {
      return this.attachNativeHls();
    }

    const hls = createHls({ autoStartLoad: false });
    this.api = hls;
    let sessionId: string | undefined;

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    hls.on(Hls.Events.MANIFEST_PARSED, async () => {
      sessionId = getHlsSessionId(hls);
      await filterEfficientLevels(hls);
      this.levels = hls.levels;
      hls.attachMedia(video); // Need to attach after filtering for the auto size cap to work
      hls.startLoad(startPosition);
      // autoStartLoad defers the first fragment, so the `autoplay` attribute may have already fired and done nothing
      if (video.autoplay && video.paused) {
        void video.play().catch(() => {});
      }
    });
    hls.on(Hls.Events.LEVELS_UPDATED, (_, data) => (this.levels = data.levels));
    hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => (this.#level = data.level));
    hls.on(Hls.Events.FRAG_LOADED, () => (this.rebuilds = 0));
    hls.on(Hls.Events.ERROR, (_, data) => this.onHlsError(data));

    const onPageHide = (event: PageTransitionEvent) => {
      if (!event.persisted && sessionId) {
        releaseHlsSession(this.assetId, sessionId);
      }
    };
    window.addEventListener('pagehide', onPageHide);

    hls.loadSource(getAssetHlsUrl(this.assetId));

    return () => {
      window.removeEventListener('pagehide', onPageHide);
      if (sessionId) {
        releaseHlsSession(this.assetId, sessionId);
      }
      hls.destroy();
      this.api = undefined;
      this.levels = [];
      this.#level = -1;
      this.selectedLevel = -1;
    };
  }

  private attachNativeHls() {
    if (this.element.canPlayType(HLS_MIME)) {
      this.element.src = getAssetHlsUrl(this.assetId);
    } else {
      this.error = true;
      this.loading = false;
    }
    return () => this.detachSource();
  }

  private onHlsError(data: ErrorData) {
    // A fragment 404 usually means the server session expired (e.g. after a long pause). Rebuild it
    // once, resuming where we left off, before giving up.
    if (
      data.fatal &&
      data.details === Hls.ErrorDetails.FRAG_LOAD_ERROR &&
      data.response?.code === 404 &&
      this.rebuilds < MAX_REBUILDS
    ) {
      this.rebuilds++;
      this.loading = true;
      this.error = false;
      const resume = this.element.currentTime;
      this.sourceTeardown?.();
      this.sourceTeardown = this.attachHls(resume);
      return;
    }
    if (data.fatal) {
      console.error('Fatal HLS error', data.details, data.response?.code);
      this.error = true;
      this.loading = false;
    }
  }
}
