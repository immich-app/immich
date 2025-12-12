import { eventManager } from '$lib/managers/event-manager.svelte';
import { getConfig, getConfigDefaults, type SystemConfigDto } from '@immich/sdk';
import { cloneDeep } from 'lodash-es';

class SystemConfigManager {
  #value?: SystemConfigDto = $state();
  #defaultValue?: SystemConfigDto = $state();

  constructor() {
    eventManager.on('SystemConfigUpdate', (config) => (this.#value = config));
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

  set value(config: SystemConfigDto) {
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
