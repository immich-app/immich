import {
  getAdminConfigFields,
  getConfig,
  getConfigDefaults,
  type AdminConfigDto,
  type AdminConfigFieldDto,
} from '@immich/sdk';
import { cloneDeep } from 'lodash-es';
import { eventManager } from '$lib/managers/event-manager.svelte';

type Leaves<T> = T extends object
  ? {
      [K in keyof T & string]: T[K] extends readonly unknown[] ? K : T[K] extends object ? `${K}.${Leaves<T[K]>}` : K;
    }[keyof T & string]
  : never;

export type ConfigKey = Leaves<AdminConfigDto>;

class SystemConfigManager {
  #value?: AdminConfigDto = $state();
  #defaultValue?: AdminConfigDto = $state();
  #fields?: Record<string, AdminConfigFieldDto> = $state();

  constructor() {
    eventManager.on({
      SystemConfigUpdate: (config) => {
        this.#value = config;
        void this.#loadFields();
      },
    });
  }

  async init() {
    await this.#loadConfig();
    await this.#loadDefault();
    await this.#loadFields();
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

  getField(key: ConfigKey) {
    return this.#fields?.[key];
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

  async #loadFields() {
    const fields = await getAdminConfigFields();
    this.#fields = Object.fromEntries(fields.map((field) => [field.key, field]));
  }
}

export const systemConfigManager = new SystemConfigManager();
