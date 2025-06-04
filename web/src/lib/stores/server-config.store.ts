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

export type SystemConfig = SystemConfigDto & { loaded: boolean };
export const systemConfig = writable<SystemConfig>();

export const retrieveServerConfig = async () => {
  const [flags, config] = await Promise.all([getServerFeatures(), getServerConfig()]);

  featureFlags.update(() => ({ ...flags, loaded: true }));
  serverConfig.update(() => ({ ...config, loaded: true }));
};

export const retrieveSystemConfig = async () => {
  const config = await getConfig();
  systemConfig.update(() => ({ ...config, loaded: true }));
};
