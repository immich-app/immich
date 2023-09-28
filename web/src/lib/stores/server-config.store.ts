import { api, ServerConfigDto, ServerFeaturesDto } from '@api';
import { writable } from 'svelte/store';

export type FeatureFlags = ServerFeaturesDto & { loaded: boolean };

export const featureFlags = writable<FeatureFlags>({
  loaded: false,
  clipEncode: true,
  facialRecognition: true,
  sidecar: true,
  tagImage: true,
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
  mapTileUrl: '',
  loginPageMessage: '',
  trashDays: 30,
});

export const loadConfig = async () => {
  const [{ data: flags }, { data: config }] = await Promise.all([
    api.serverInfoApi.getServerFeatures(),
    api.serverInfoApi.getServerConfig(),
  ]);

  featureFlags.update(() => ({ ...flags, loaded: true }));
  serverConfig.update(() => ({ ...config, loaded: true }));
};
