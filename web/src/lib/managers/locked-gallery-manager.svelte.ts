import { eventManager } from '$lib/managers/event-manager.svelte';
import { isLockedAccessAllowed, revokeLockedAccess } from '$lib/services/locked-access';
import { LockedAlbumsError } from '$lib/services/locked-albums';
import { lockedMedia } from '$lib/services/locked-media';

type Tile = { id: string; url: string; video: boolean; failed: boolean };

/** No shared asset/viewer/query cache. Every URL belongs to this mounted gallery. */
export class LockedGalleryManager {
  tiles = $state<Tile[]>([]);
  previewId = $state('');
  previewUrl = $state('');
  previewFailed = $state(false);
  locked = $state(false);
  #generation = 0;
  #previewGeneration = 0;
  #controller = new AbortController();
  #previewController = new AbortController();
  #unsubscribe?: () => void;
  #timer?: ReturnType<typeof setTimeout>;

  constructor(private deadline: number) {}

  mount() {
    this.#unsubscribe = eventManager.on({
      SessionLocked: () => this.clear(),
      AuthLogout: () => this.clear(),
      SessionDelete: () => this.clear(),
    });
    if (this.#allowed()) {
      this.#timer = setTimeout(() => this.#relock(), Math.min(this.deadline - Date.now(), 2_147_483_647));
    }
  }

  #relock() {
    if (!this.locked) {
      this.clear();
      void revokeLockedAccess();
    }
  }

  #allowed() {
    if (!this.locked && !isLockedAccessAllowed(this.deadline)) {
      this.#relock();
    }
    return !this.locked;
  }

  #reset() {
    this.#generation++;
    this.#controller.abort();
    this.closePreview();
    for (const tile of this.tiles) {
      if (tile.url) {
        URL.revokeObjectURL(tile.url);
      }
    }
    this.tiles = [];
  }

  clear() {
    this.#reset();
    this.locked = true;
    clearTimeout(this.#timer);
  }

  destroy() {
    this.clear();
    this.#unsubscribe?.();
  }

  load(ids: string[]) {
    this.#reset();
    if (!this.#allowed()) {
      return;
    }
    this.#controller = new AbortController();
    const signal = this.#controller.signal;
    const generation = this.#generation;
    this.tiles = ids.map((id) => ({ id, url: '', video: false, failed: false }));
    let next = 0;
    const worker = async () => {
      while (next < ids.length && generation === this.#generation && this.#allowed()) {
        const index = next++;
        try {
          const media = await lockedMedia.load(ids[index], 'thumbnail', signal);
          if (generation !== this.#generation || !this.#allowed()) {
            return;
          }
          this.tiles[index] = {
            id: ids[index],
            url: URL.createObjectURL(media.blob),
            video: media.video,
            failed: false,
          };
        } catch (error) {
          if (generation !== this.#generation || !this.#allowed()) {
            return;
          }
          if (error instanceof LockedAlbumsError && (error.status === 401 || error.status === 403)) {
            this.#relock();
            return;
          }
          this.tiles[index].failed = true;
        }
      }
    };
    // Bound concurrent requests even for a complete membership page.
    return Promise.all(Array.from({ length: Math.min(4, ids.length) }, () => worker()));
  }

  closePreview() {
    this.#previewGeneration++;
    this.#previewController.abort();
    if (this.previewUrl) {
      URL.revokeObjectURL(this.previewUrl);
    }
    this.previewId = '';
    this.previewUrl = '';
    this.previewFailed = false;
  }

  async preview(id: string) {
    this.closePreview();
    if (!this.#allowed() || this.tiles.every((tile) => tile.id !== id)) {
      return;
    }
    this.previewId = id;
    this.#previewController = new AbortController();
    const generation = this.#previewGeneration;
    try {
      const media = await lockedMedia.load(id, 'preview', this.#previewController.signal);
      if (generation === this.#previewGeneration && this.#allowed()) {
        this.previewUrl = URL.createObjectURL(media.blob);
      }
    } catch (error) {
      if (generation !== this.#previewGeneration || !this.#allowed()) {
        return;
      }
      if (error instanceof LockedAlbumsError && (error.status === 401 || error.status === 403)) {
        this.#relock();
      } else {
        this.previewFailed = true;
      }
    }
  }
}
