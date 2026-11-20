import { featureFlagsManager } from '#lib/managers/feature-flags-manager.svelte.ts';
import { queryClient } from '#lib/queries/client.ts';
import { QueryKeys } from '#lib/queries/query-keys.ts';
import {
  getAdminConfig,
  getAdminConfigDefaults,
  getAdminStorageTemplateOptions,
  previewStorageTemplate,
  updateAdminConfig,
  type AdminConfigDto,
} from '@immich/sdk';
import { mutationOptions, queryOptions } from '@tanstack/svelte-query';
import { isEqual } from 'lodash-es';

export const getAdminConfigQuery = () =>
  queryOptions({
    queryKey: QueryKeys.adminConfig(),
    queryFn: ({ signal }) => getAdminConfig({ signal }),
    gcTime: Infinity,
  });

export const getAdminConfigDefaultsQuery = () =>
  queryOptions({
    queryKey: QueryKeys.adminConfigDefaults(),
    queryFn: ({ signal }) => getAdminConfigDefaults({ signal }),
  });

export const getStorageTemplateOptionsQuery = () =>
  queryOptions({
    queryKey: QueryKeys.storageTemplate(),
    queryFn: ({ signal }) => getAdminStorageTemplateOptions({ signal }),
  });

export const getStorageTemplatePreviewQuery = (template: string) =>
  queryOptions({
    queryKey: QueryKeys.storageTemplatePreview({ template }),
    queryFn: ({ signal }) => previewStorageTemplate({ storageTemplatePreviewDto: { template } }, { signal }),
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
        queryClient.invalidateQueries({ queryKey: QueryKeys.userConfig() }),
        queryClient.invalidateQueries({ queryKey: QueryKeys.publicConfig() }),
        featureFlagsManager.init(),
      ]);
    },
    meta: { success: { toast: 'settings_saved' }, error: { toast: 'errors.unable_to_save_settings' } },
  });
