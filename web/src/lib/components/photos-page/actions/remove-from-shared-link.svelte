<script lang="ts">
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import { getKey, s } from '$lib/utils';
  import { handleError } from '$lib/utils/handle-error';
  import { removeSharedLinkAssets, type SharedLinkResponseDto } from '@immich/sdk';
  import { mdiDeleteOutline } from '@mdi/js';
  import { NotificationType, notificationController } from '../../shared-components/notification/notification';
  import { getAssetControlContext } from '../asset-select-control-bar.svelte';
  import { dialogController } from '$lib/components/shared-components/dialog/dialog';

  export let sharedLink: SharedLinkResponseDto;

  const { getAssets, clearSelect } = getAssetControlContext();

  const handleRemove = async () => {
    const isConfirmed = await dialogController.show({
      id: 'remove-from-shared-link',
      title: 'Remove assets?',
      prompt: `Are you sure you want to remove ${getAssets().size} asset${s(getAssets().size)} from this shared link?`,
      confirmText: 'Remove',
    });

    if (!isConfirmed) {
      return;
    }

    try {
      const results = await removeSharedLinkAssets({
        id: sharedLink.id,
        assetIdsDto: {
          assetIds: [...getAssets()].map((asset) => asset.id),
        },
        key: getKey(),
      });

      for (const result of results) {
        if (!result.success) {
          continue;
        }

        sharedLink.assets = sharedLink.assets.filter((asset) => asset.id !== result.assetId);
      }

      const count = results.filter((item) => item.success).length;

      notificationController.show({
        type: NotificationType.Info,
        message: `Removed ${count} assets`,
      });

      clearSelect();
    } catch (error) {
      handleError(error, 'Unable to remove assets from shared link');
    }
  };
</script>

<CircleIconButton title="Remove from shared link" on:click={handleRemove} icon={mdiDeleteOutline} />
