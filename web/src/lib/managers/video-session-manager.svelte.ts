import { SvelteMap } from 'svelte/reactivity';
import { VideoController, type VideoControllerOptions } from '$lib/utils/video/controller.svelte';

interface Session {
  controller: VideoController;
  refs: number;
  timer?: NodeJS.Timeout;
}

/**
 * Registry of controllers keyed by asset, ref-counted with a grace period. `<immich-video>` acquires and
 * releases as it connects and disconnects, with controllers kept briefly before being disposed. This enables
 * reuse of bandwidth estimation, downloaded segments, HLS session, etc. for seamless handoff.
 */
class VideoSessionManager {
  #sessions = new SvelteMap<string, Session>();

  acquire(options: VideoControllerOptions): VideoController {
    const existing = this.#sessions.get(options.assetId);
    if (existing) {
      clearTimeout(existing.timer);
      existing.timer = undefined;
      existing.refs++;
      return existing.controller;
    }
    const controller = new VideoController(options);
    this.#sessions.set(options.assetId, { controller, refs: 1, timer: undefined });
    return controller;
  }

  release(assetId: string) {
    const session = this.#sessions.get(assetId);
    if (!session || --session.refs > 0) {
      return;
    }
    session.timer = setTimeout(() => {
      session.controller.release();
      this.#sessions.delete(assetId);
    }, 1_000);
  }

  get(assetId: string): VideoController | undefined {
    return this.#sessions.get(assetId)?.controller;
  }
}

export const videoSessionManager = new VideoSessionManager();
