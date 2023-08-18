import { api, ServerFeaturesDto } from '@api';
import { writable } from 'svelte/store';

export type FeatureFlags = ServerFeaturesDto;

export const featureFlags = writable<FeatureFlags>({
  machineLearning: true,
  search: true,
  oauth: true,
  oauthAutoLaunch: true,
  passwordLogin: true,
});

export const loadFeatureFlags = async () => {
  const { data } = await api.serverInfoApi.getServerFeatures();
  featureFlags.update(() => data);
};
