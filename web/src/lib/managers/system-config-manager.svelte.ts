import { ManagerQueryState } from '$lib/queries/manager-query-state.svelte';
import { systemConfigQueries } from '$lib/queries/system-config.query';

class SystemConfigManager {
  #config = new ManagerQueryState(systemConfigQueries.config);
  #defaults = new ManagerQueryState(systemConfigQueries.defaults);

  async init() {
    await Promise.all([this.#config.load(), this.#defaults.load()]);
  }

  get value() {
    return this.#config.data;
  }

  get defaultValue() {
    return this.#defaults.data;
  }

  cloneValue() {
    return this.#config.clone();
  }

  cloneDefaultValue() {
    return this.#defaults.clone();
  }
}

export const systemConfigManager = new SystemConfigManager();
