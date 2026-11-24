import { featureFlagsManager } from '#lib/managers/feature-flags-manager.svelte.ts';
import { queryClient } from '#lib/queries/client.ts';
import { QueryKeys } from '#lib/queries/query-keys.ts';
import {
  getAdminConfig,
  getAdminConfigDefaults,
  getAdminConfigFields,
  getAdminStorageTemplateOptions,
  previewStorageTemplate,
  updateAdminConfig,
  type AdminConfigDto,
} from '@immich/sdk';
import { createQuery, mutationOptions, queryOptions } from '@tanstack/svelte-query';
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

type Leaves<T> = T extends object
  ? {
      [K in keyof T & string]: T[K] extends readonly unknown[] ? K : T[K] extends object ? `${K}.${Leaves<T[K]>}` : K;
    }[keyof T & string]
  : never;

export type AdminConfigKey = Leaves<AdminConfigDto>;

export const getAdminConfigFieldsQuery = () =>
  queryOptions({
    queryKey: QueryKeys.adminConfigFields(),
    queryFn: ({ signal }) => getAdminConfigFields({ signal }),
  });

export const getAdminConfigFieldQuery = (key?: AdminConfigKey) =>
  queryOptions({
    ...getAdminConfigFieldsQuery(),
    select: (fields) => fields.find((field) => field.key === key),
    enabled: !!key,
  });

export const createAdminConfigField = (key: () => AdminConfigKey | undefined) => {
  const query = createQuery(
    () => getAdminConfigFieldQuery(key()),
    () => queryClient,
  );

  return {
    get field() {
      return query.data;
    },
    get isLocked() {
      return query.data?.isEditable === false;
    },
  };
};

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
        queryClient.invalidateQueries({ queryKey: QueryKeys.adminConfigFields() }),
        queryClient.invalidateQueries({ queryKey: QueryKeys.userConfig() }),
        queryClient.invalidateQueries({ queryKey: QueryKeys.publicConfig() }),
        featureFlagsManager.init(),
      ]);
    },
    meta: { success: { toast: 'settings_saved' }, error: { toast: 'errors.unable_to_save_settings' } },
  });
