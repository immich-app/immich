import { CustomVideoElement } from 'custom-media-element';
import { videoSessionManager } from '$lib/managers/video-session-manager.svelte';
import type { VideoController } from '$lib/utils/video/controller.svelte';

/**
 * Video backed by either HLS or a progressive stream based on feature flags and user preferences. Can be managed with
 * `videoSessionManager.get(assetId)`, this manager being what allows it to reparent the underlying video element.
 */
class ImmichVideoElement extends CustomVideoElement {
  static override get observedAttributes() {
    return [...super.observedAttributes, 'asset-id', 'play-original'];
  }

  #controller: VideoController | undefined;
  #mountedAssetId: string | undefined;
  #remountScheduled = false;

  override connectedCallback() {
    super.connectedCallback();
    this.#mount();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.#unmount();
  }

  override attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
    super.attributeChangedCallback(name, oldValue, newValue);
    if (!this.isConnected || !this.#controller || oldValue === newValue) {
      return;
    }
    if (name === 'play-original') {
      this.#controller.playOriginal = newValue === 'true';
    } else if (name === 'asset-id' && !this.#remountScheduled) {
      this.#remountScheduled = true;
      queueMicrotask(() => {
        this.#remountScheduled = false;
        if (this.isConnected) {
          this.#unmount();
          this.#mount();
        }
      });
    }
  }

  #mount() {
    const assetId = this.getAttribute('asset-id');
    if (!assetId) {
      return;
    }
    const controller = videoSessionManager.acquire({
      assetId,
      cacheKey: this.getAttribute('cache-key') || null,
      playOriginal: this.getAttribute('play-original') === 'true',
    });
    this.#controller = controller;
    this.#mountedAssetId = assetId;

    const video = controller.element;
    video.slot = 'media';
    video.loop = this.loop;
    video.autoplay = this.autoplay;
    video.muted = this.muted || this.hasAttribute('muted');
    video.poster = this.getAttribute('poster') ?? '';
    controller.mount(this);
  }

  #unmount() {
    if (!this.#mountedAssetId) {
      return;
    }
    this.#controller?.unmount(this);
    videoSessionManager.release(this.#mountedAssetId);
    this.#controller = undefined;
    this.#mountedAssetId = undefined;
  }
}

if (globalThis.customElements && !customElements.get('immich-video')) {
  customElements.define('immich-video', ImmichVideoElement);
}

export default ImmichVideoElement;
