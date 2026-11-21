import { queryClient } from '#lib/queries/client.ts';
import { getServerFeaturesQuery } from '#lib/queries/server-info.query.ts';
import type { ServerFeaturesDto } from '@immich/sdk';

class FeatureFlagsManager {
  #value?: ServerFeaturesDto = $state();

  async init() {
    this.#value = await queryClient.query(getServerFeaturesQuery());
  }

  get value() {
    if (!this.#value) {
      throw new Error('Feature flags manager must be initialized first');
    }

    return this.#value;
  }
}

export const featureFlagsManager = new FeatureFlagsManager();
