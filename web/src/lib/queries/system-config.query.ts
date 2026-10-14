import { getConfig, getConfigDefaults } from '@immich/sdk';
import { queryOptions } from '@tanstack/svelte-query';
import { eventManager } from '$lib/managers/event-manager.svelte';
import { queryClient } from '$lib/queries/client';
import { websocketEvents } from '$lib/stores/websocket';

export const systemConfigKeys = {
  all: ['system-config'] as const,
  defaults: () => [...systemConfigKeys.all, 'defaults'] as const,
};

class SystemConfigQueries {
  readonly config = queryOptions({
    queryKey: systemConfigKeys.all,
    queryFn: ({ signal }) => getConfig({ signal }),
    staleTime: Infinity,
  });

  readonly defaults = queryOptions({
    queryKey: systemConfigKeys.defaults(),
    queryFn: ({ signal }) => getConfigDefaults({ signal }),
    staleTime: Infinity,
  });

  constructor() {
    eventManager.on({
      SystemConfigUpdate: (config) => queryClient.setQueryData(this.config.queryKey, config),
      AuthLogout: () => queryClient.resetQueries({ queryKey: this.config.queryKey, exact: true }),
    });

    websocketEvents.on('on_config_update', () => void this.#refresh());
  }

  #refresh() {
    const loaded = queryClient.getQueryData(this.config.queryKey) !== undefined;

    return queryClient.invalidateQueries({
      queryKey: this.config.queryKey,
      exact: true,
      refetchType: loaded ? 'all' : 'none',
    });
  }
}

export const systemConfigQueries = new SystemConfigQueries();
