import { type ServerConfigDto, type ServerFeaturesDto } from '@api';
import { getServerConfig, getServerFeatures } from '@immich/sdk';
import { writable } from 'svelte/store';

export type FeatureFlags = ServerFeaturesDto & { loaded: boolean };

export const featureFlags = writable<FeatureFlags>({
  loaded: false,
  smartSearch: true,
  facialRecognition: true,
  sidecar: true,
  map: true,
  reverseGeocoding: true,
  search: true,
  oauth: false,
  oauthAutoLaunch: false,
  passwordLogin: true,
  configFile: false,
  trash: true,
});

export type ServerConfig = ServerConfigDto & { loaded: boolean };

export const serverConfig = writable<ServerConfig>({
  loaded: false,
  oauthButtonText: '',
  loginPageMessage: '',
  trashDays: 30,
  isInitialized: false,
  isOnboarded: false,
  externalDomain: '',
});

export const loadConfig = async () => {
  const [flags, config] = await Promise.all([getServerFeatures(), getServerConfig()]);

  featureFlags.update(() => ({ ...flags, loaded: true }));
  serverConfig.update(() => ({ ...config, loaded: true }));
};
