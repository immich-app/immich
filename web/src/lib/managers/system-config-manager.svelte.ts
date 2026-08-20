import { getConfig, getConfigDefaults, type AdminConfigDto } from '@immich/sdk';
import { cloneDeep } from 'lodash-es';
import { eventManager } from '$lib/managers/event-manager.svelte';

class SystemConfigManager {
  #value?: AdminConfigDto = $state();
  #defaultValue?: AdminConfigDto = $state();

  constructor() {
    eventManager.on({
      SystemConfigUpdate: (config) => (this.#value = config),
    });
  }

  async init() {
    await this.#loadConfig();
    await this.#loadDefault();
  }

  get value() {
    if (!this.#value) {
      throw new Error('Server config manager must be initialized first');
    }

    return this.#value;
  }

  set value(config: AdminConfigDto) {
    this.#value = config;
  }

  get defaultValue() {
    if (!this.#defaultValue) {
      throw new Error('Server config manager must be initialized first');
    }

    return this.#defaultValue;
  }

  cloneValue() {
    return cloneDeep(this.value);
  }

  cloneDefaultValue() {
    return cloneDeep(this.defaultValue);
  }

  async #loadConfig() {
    this.#value = await getConfig();
  }

  async #loadDefault() {
    this.#defaultValue = await getConfigDefaults();
  }
}

export const systemConfigManager = new SystemConfigManager();
