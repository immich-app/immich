import { eventManager } from '$lib/managers/event-manager.svelte';
import { getServerConfig, type ServerConfigDto } from '@immich/sdk';

class ServerConfigManager {
  #value?: ServerConfigDto = $state();

  constructor() {
    eventManager.on('SystemConfigUpdate', () => void this.loadServerConfig());
  }

  async init() {
    await this.loadServerConfig();
  }

  get value() {
    if (!this.#value) {
      throw new Error('Server config manager must be initialized first');
    }

    return this.#value;
  }

  async loadServerConfig() {
    this.#value = await getServerConfig();
  }
}

export const serverConfigManager = new ServerConfigManager();
