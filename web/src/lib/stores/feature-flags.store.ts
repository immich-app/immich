import { api, ServerFeaturesDto } from '@api';
import { writable } from 'svelte/store';

export type FeatureFlags = ServerFeaturesDto & { loaded: boolean };

export const featureFlags = writable<FeatureFlags>({
  loaded: false,
  clipEncode: true,
  facialRecognition: true,
  sidecar: true,
  tagImage: true,
  search: true,
  oauth: false,
  oauthAutoLaunch: false,
  passwordLogin: true,
  configFile: false,
});

export const loadFeatureFlags = async () => {
  const { data } = await api.serverInfoApi.getServerFeatures();
  featureFlags.update(() => ({ ...data, loaded: true }));
};
