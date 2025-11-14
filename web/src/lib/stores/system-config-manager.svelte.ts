import { eventManager } from '$lib/managers/event-manager.svelte';
import {
  getConfig,
  getConfigDefaults,
  getServerConfig,
  getServerFeatures,
  type ServerConfigDto,
  type ServerFeaturesDto,
  type SystemConfigDto,
} from '@immich/sdk';
import { cloneDeep } from 'lodash-es';
import { writable } from 'svelte/store';

export type FeatureFlags = ServerFeaturesDto & { loaded: boolean };

export const featureFlags = writable<FeatureFlags>({
  loaded: false,
  smartSearch: true,
  duplicateDetection: false,
  facialRecognition: true,
  importFaces: false,
  sidecar: true,
  map: true,
  reverseGeocoding: true,
  search: true,
  oauth: false,
  oauthAutoLaunch: false,
  passwordLogin: true,
  configFile: false,
  trash: true,
  email: false,
  ocr: true,
});

export type ServerConfig = ServerConfigDto & { loaded: boolean };

export const serverConfig = writable<ServerConfig>({
  loaded: false,
  oauthButtonText: '',
  loginPageMessage: '',
  trashDays: 30,
  userDeleteDelay: 7,
  isInitialized: false,
  isOnboarded: false,
  externalDomain: '',
  mapDarkStyleUrl: '',
  mapLightStyleUrl: '',
  publicUsers: true,
});

class SystemConfigManager {
  #value?: SystemConfigDto = $state();
  #defaultValue?: SystemConfigDto = $state();

  constructor() {
    eventManager.on('SystemConfigUpdate', (config) => (this.#value = config));
  }

  get value() {
    if (!this.#value) {
      throw new Error('System config dto must be initialized first');
    }

    return this.#value;
  }

  set value(config: SystemConfigDto) {
    this.#value = config;
  }

  get defaultValue() {
    if (!this.#defaultValue) {
      throw new Error('System config dto must be initialized first');
    }

    return this.#defaultValue;
  }

  cloneValue() {
    return cloneDeep(this.value);
  }

  cloneDefaultValue() {
    return cloneDeep(this.defaultValue);
  }

  async init() {
    await this.#loadConfig();
    await this.#loadDefault();
  }

  async #loadConfig() {
    this.#value = await getConfig();
  }

  async #loadDefault() {
    this.#defaultValue = await getConfigDefaults();
  }
}

export const retrieveServerConfig = async () => {
  const [flags, config] = await Promise.all([getServerFeatures(), getServerConfig()]);

  featureFlags.update(() => ({ ...flags, loaded: true }));
  serverConfig.update(() => ({ ...config, loaded: true }));
};

export const systemConfigManager = new SystemConfigManager();
