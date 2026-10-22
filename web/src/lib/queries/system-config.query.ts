import { getConfig, getConfigDefaults, updateConfig, type AdminConfigDto } from '@immich/sdk';
import { toastManager } from '@immich/ui';
import { mutationOptions, queryOptions } from '@tanstack/svelte-query';
import { isEqual } from 'lodash-es';
import { eventManager } from '$lib/managers/event-manager.svelte';
import { queryClient } from '$lib/queries/client';
import { getFormatter } from '$lib/utils/i18n';

export const getConfigQuery = () =>
  queryOptions({
    queryKey: ['system-config'],
    queryFn: ({ signal }) => getConfig({ signal }),
  });

export const getConfigDefaultsQuery = () =>
  queryOptions({
    queryKey: ['system-config', 'defaults'],
    queryFn: ({ signal }) => getConfigDefaults({ signal }),
  });

export const updateConfigMutation = () =>
  mutationOptions({
    mutationFn: async (update: Partial<AdminConfigDto>) => {
      const config = await getConfig();
      const adminConfigDto = { ...config, ...update };

      if (isEqual(config, adminConfigDto)) {
        return;
      }

      return updateConfig({ adminConfigDto });
    },
    onSuccess: async (config) => {
      if (!config) {
        return;
      }

      queryClient.setQueryData(getConfigQuery().queryKey, config);
      eventManager.emit('SystemConfigUpdate', config);

      const $t = await getFormatter();
      toastManager.primary($t('settings_saved'));
    },
    meta: { error: { toast: 'errors.unable_to_save_settings' } },
  });
