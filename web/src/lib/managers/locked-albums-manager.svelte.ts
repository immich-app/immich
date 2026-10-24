import { eventManager } from '$lib/managers/event-manager.svelte';
import {
  isLockedAccessAllowed,
  requireLockedPin,
  revokeLockedAccess,
  subscribeToSharedLocks,
} from '$lib/services/locked-access';
import { lockedAlbums, LockedAlbumsError, type LockedAlbum } from '$lib/services/locked-albums';

/** Component-scoped, in-memory experimental state. Never put this in the query cache. */
export class LockedAlbumsManager {
  albums = $state<LockedAlbum[]>([]);
  selectedId = $state('');
  assetIds = $state<string[]>([]);
  hasNextPage = $state(false);
  busy = $state(false);
  locked = $state(false);
  #generation = 0;
  #controller = new AbortController();
  #timer?: ReturnType<typeof setTimeout>;
  #expiresAt = 0;
  #unsubscribe?: () => void;
  #unsubscribeShared?: () => void;

  constructor(private onError: (error: unknown) => void) {}

  mount(onLock: () => void, deadline: number) {
    const lock = () => {
      requireLockedPin();
      this.clear();
      onLock();
    };
    this.#unsubscribe = eventManager.on({ SessionLocked: lock, AuthLogout: lock, SessionDelete: lock });
    this.#unsubscribeShared = subscribeToSharedLocks();
    this.#expiresAt = deadline;
    if (!isLockedAccessAllowed(deadline)) {
      this.#relock();
      return;
    }
    this.#timer = setTimeout(() => this.#relock(), Math.min(deadline - Date.now(), 2_147_483_647));
    void this.#run(
      (signal) => lockedAlbums.list(signal),
      (albums) => (this.albums = albums),
    );
  }

  #relock() {
    if (this.locked) {
      return;
    }
    this.clear();
    void revokeLockedAccess();
  }

  clear() {
    this.#generation++;
    this.#controller.abort();
    clearTimeout(this.#timer);
    this.albums = [];
    this.selectedId = '';
    this.assetIds = [];
    this.hasNextPage = false;
    this.busy = false;
    this.locked = true;
  }

  destroy() {
    this.clear();
    this.#unsubscribe?.();
    this.#unsubscribeShared?.();
  }

  async #run<T>(request: (signal: AbortSignal) => Promise<T>, apply: (value: T) => void) {
    if (!this.locked && !isLockedAccessAllowed(this.#expiresAt)) {
      this.#relock();
    }
    if (this.busy || this.locked) {
      return;
    }
    const generation = this.#generation;
    this.busy = true;
    try {
      const value = await request(this.#controller.signal);
      if (!this.locked && !isLockedAccessAllowed(this.#expiresAt)) {
        this.#relock();
      }
      if (generation === this.#generation && !this.locked) {
        apply(value);
      }
    } catch (error) {
      if (generation !== this.#generation) {
        return;
      }
      if (error instanceof LockedAlbumsError && (error.status === 401 || error.status === 403)) {
        this.#relock();
      } else {
        this.onError(error);
      }
    } finally {
      if (generation === this.#generation) {
        this.busy = false;
      }
    }
  }

  select(id: string) {
    if (this.busy || this.locked) {
      return;
    }
    this.selectedId = id;
    this.assetIds = [];
    this.hasNextPage = false;
    if (id) {
      return this.#run(
        (signal) => lockedAlbums.assets(id, 0, signal),
        (page) => {
          this.assetIds = page.assetIds;
          this.hasNextPage = page.hasNextPage;
        },
      );
    }
  }

  more() {
    return this.#run(
      (signal) => lockedAlbums.assets(this.selectedId, this.assetIds.length, signal),
      (page) => {
        this.assetIds = [...this.assetIds, ...page.assetIds];
        this.hasNextPage = page.hasNextPage;
      },
    );
  }

  refresh() {
    const id = this.selectedId;
    return this.#run(
      async (signal) => {
        const albums = await lockedAlbums.list(signal);
        signal.throwIfAborted();
        const page =
          id && albums.some((album) => album.id === id) ? await lockedAlbums.assets(id, 0, signal) : undefined;
        return { albums, page };
      },
      ({ albums, page }) => {
        this.albums = albums;
        this.assetIds = page?.assetIds ?? [];
        this.hasNextPage = page?.hasNextPage ?? false;
        if (!page) {
          this.selectedId = '';
        }
      },
    );
  }

  create(name: string) {
    return this.#run(
      (signal) => lockedAlbums.create(name.trim(), signal),
      (album) => (this.albums = [...this.albums, album]),
    );
  }

  rename(name: string) {
    return this.#run(
      (signal) => lockedAlbums.rename(this.selectedId, name.trim(), signal),
      (album) => (this.albums = this.albums.map((current) => (current.id === album.id ? album : current))),
    );
  }

  delete() {
    const id = this.selectedId;
    return this.#run(
      (signal) => lockedAlbums.delete(id, signal),
      () => {
        this.albums = this.albums.filter((album) => album.id !== id);
        this.selectedId = '';
        this.assetIds = [];
        this.hasNextPage = false;
      },
    );
  }

  updateAssets(ids: string[], add: boolean) {
    const id = this.selectedId;
    return this.#run(
      async (signal) => {
        await lockedAlbums.updateAssets(id, ids, add, signal);
        signal.throwIfAborted();
        return Promise.all([lockedAlbums.list(signal), lockedAlbums.assets(id, 0, signal)]);
      },
      ([albums, page]) => {
        this.albums = albums;
        this.assetIds = page.assetIds;
        this.hasNextPage = page.hasNextPage;
      },
    );
  }
}
