import { getServerFeatures, type ServerFeaturesDto } from '@immich/sdk';
import { eventManager } from '$lib/managers/event-manager.svelte';

class FeatureFlagsManager {
  #value?: ServerFeaturesDto = $state();

  constructor() {
    eventManager.on({
      SystemConfigUpdate: () => void this.#loadFeatureFlags(),
    });
  }

  async init() {
    await this.#loadFeatureFlags();
  }

  get value() {
    if (!this.#value) {
      throw new Error('Feature flags manager must be initialized first');
    }

    return this.#value;
  }

  async #loadFeatureFlags() {
    this.#value = await getServerFeatures();
  }
}

export const featureFlagsManager = new FeatureFlagsManager();
