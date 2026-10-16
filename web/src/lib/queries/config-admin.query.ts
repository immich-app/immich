import { getAdminConfig, getAdminConfigDefaults, updateAdminConfig, type AdminConfigDto } from '@immich/sdk';
import { toastManager } from '@immich/ui';
import { mutationOptions, queryOptions } from '@tanstack/svelte-query';
import { isEqual } from 'lodash-es';
import { eventManager } from '$lib/managers/event-manager.svelte';
import { queryClient } from '$lib/queries/client';
import { getPublicConfigQuery } from '$lib/queries/config-public.query';
import { getUserConfigQuery } from '$lib/queries/config-user.query';
import { getFormatter } from '$lib/utils/i18n';

export const getAdminConfigQuery = () =>
  queryOptions({
    queryKey: ['config', 'admin'],
    queryFn: ({ signal }) => getAdminConfig({ signal }),
  });

export const getAdminConfigDefaultsQuery = () =>
  queryOptions({
    queryKey: ['config', 'admin', 'defaults'],
    queryFn: ({ signal }) => getAdminConfigDefaults({ signal }),
  });

export const updateAdminConfigMutation = () =>
  mutationOptions({
    mutationFn: async (update: Partial<AdminConfigDto>) => {
      const config = await getAdminConfig();
      const adminConfigDto = { ...config, ...update };

      if (isEqual(config, adminConfigDto)) {
        return;
      }

      return updateAdminConfig({ adminConfigDto });
    },
    onSuccess: async (config) => {
      if (!config) {
        return;
      }

      queryClient.setQueryData(getAdminConfigQuery().queryKey, config);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getUserConfigQuery().queryKey }),
        queryClient.invalidateQueries({ queryKey: getPublicConfigQuery().queryKey }),
      ]);
      eventManager.emit('SystemConfigUpdate', config);

      const $t = await getFormatter();
      toastManager.primary($t('settings_saved'));
    },
    meta: { error: { toast: 'errors.unable_to_save_settings' } },
  });
