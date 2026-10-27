import { asMutation, queryClient } from '#lib/queries/client.ts';
import { createApiKey, deleteApiKey, getApiKeys, rotateApiKey, updateApiKey } from '@immich/sdk';
import { queryOptions } from '@tanstack/svelte-query';

export const getApiKeysQuery = () =>
  queryOptions({
    queryKey: ['api-keys'],
    queryFn: ({ signal }) => getApiKeys({ signal }),
  });

export const createApiKeyMutation = () =>
  asMutation(createApiKey, {
    onSuccess: () => queryClient.invalidateQueries({ queryKey: getApiKeysQuery().queryKey }),
    meta: { error: { toast: 'errors.unable_to_create_api_key' } },
  });

export const updateApiKeyMutation = () =>
  asMutation(updateApiKey, {
    onSuccess: (apiKey) =>
      queryClient.setQueryData(getApiKeysQuery().queryKey, (keys) =>
        keys?.map((item) => (item.id === apiKey.id ? apiKey : item)),
      ),
    meta: { success: { toast: 'saved_api_key' }, error: { toast: 'errors.unable_to_save_api_key' } },
  });

export const rotateApiKeyMutation = () =>
  asMutation(rotateApiKey, {
    onSuccess: ({ apiKey }) =>
      queryClient.setQueryData(getApiKeysQuery().queryKey, (keys) =>
        keys?.map((item) => (item.id === apiKey.id ? apiKey : item)),
      ),
  });

export const deleteApiKeyMutation = () =>
  asMutation(deleteApiKey, {
    onSuccess: (_, [{ id }]) =>
      queryClient.setQueryData(getApiKeysQuery().queryKey, (keys) => keys?.filter((key) => key.id !== id)),
    meta: { error: { toast: 'errors.unable_to_remove_api_key' } },
  });
