import { getAboutInfo, getStorage, type ServerAboutResponseDto, type ServerStorageResponseDto } from '@immich/sdk';
import { authManager } from '$lib/managers/auth-manager.svelte';
import { eventManager } from '$lib/managers/event-manager.svelte';

class ServerManager {
  #about = $state<ServerAboutResponseDto>();
  #storage = $state<ServerStorageResponseDto>();
  #loading: Promise<void> | undefined;

  get about() {
    return this.#about;
  }

  get storage() {
    return this.#storage;
  }

  constructor() {
    eventManager.on({
      AuthUserLoaded: () => this.load(),
      AuthLogout: () => this.#reset(),
    });

    if (authManager.authenticated) {
      void this.load();
    }
  }

  load() {
    this.#loading ??= this.#refresh()
      .catch((error) => console.error(`[ServerManager] failed to load server information: ${error}`, error))
      .finally(() => (this.#loading = undefined));

    return this.#loading;
  }

  async ready() {
    if (this.#about && this.#storage) {
      return;
    }

    await this.load();
  }

  async #refresh() {
    const [about, storage] = await Promise.all([getAboutInfo(), getStorage()]);
    this.#about = about;
    this.#storage = storage;
  }

  #reset() {
    this.#about = undefined;
    this.#storage = undefined;
  }
}

export const serverManager = new ServerManager();
