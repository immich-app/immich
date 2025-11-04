import {
  getConfig,
  getServerConfig,
  getServerFeatures,
  type ServerConfigDto,
  type ServerFeaturesDto,
  type SystemConfigDto,
} from '@immich/sdk';
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
  maintenanceMode: false,
});

export type SystemConfig = SystemConfigDto & { loaded: boolean };
export const systemConfig = writable<SystemConfig>();

export const retrieveServerConfig = async () => {
  const configPromise = getServerConfig();
  const featurePromise = getServerFeatures();

  const config = await configPromise;
  serverConfig.update(() => ({ ...config, loaded: true }));

  // features will fail to load if we're in maintenance mode
  if (!config.maintenanceMode) {
    const flags = await featurePromise;
    featureFlags.update(() => ({ ...flags, loaded: true }));
  }

  return config;
};

export const retrieveSystemConfig = async () => {
  const config = await getConfig();
  systemConfig.update(() => ({ ...config, loaded: true }));
};
