import { goto } from '$app/navigation';
import { eventManager } from '$lib/managers/event-manager.svelte';
import { Route } from '$lib/route';
import { handleError } from '$lib/utils/handle-error';
import { addAssets } from '@immich/sdk';
import { toastManager } from '@immich/ui';
import { t } from 'svelte-i18n';
import { get } from 'svelte/store';

export const addAssetsToSpace = async (spaceId: string, assetIds: string[], { notify }: { notify: boolean }) => {
  const $t = get(t);

  try {
    await addAssets({ id: spaceId, sharedSpaceAssetAddDto: { assetIds } });
    eventManager.emit('SpaceAddAssets', { assetIds, spaceId });

    if (notify) {
      toastManager.primary(
        {
          description: $t('added_to_space_count', { values: { count: assetIds.length } }),
          button: { label: $t('view_space'), onclick: () => goto(Route.viewSpace({ id: spaceId })) },
        },
        { timeout: 5000 },
      );
    }

    return true;
  } catch (error) {
    handleError(error, $t('errors.error_adding_assets_to_space'));
    return false;
  }
};
