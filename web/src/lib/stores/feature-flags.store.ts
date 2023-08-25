import { api, ServerFeaturesDto } from '@api';
import { writable } from 'svelte/store';

export type FeatureFlags = ServerFeaturesDto;

export const featureFlags = writable<FeatureFlags>({
  clipEncode: true,
  facialRecognition: true,
  sidecar: true,
  tagImage: true,
  search: true,
  oauth: true,
  oauthAutoLaunch: true,
  passwordLogin: true,
  configFile: false,
});

export const loadFeatureFlags = async () => {
  const { data } = await api.serverInfoApi.getServerFeatures();
  featureFlags.update(() => data);
};
