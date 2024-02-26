<script lang="ts">
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import { getKey } from '$lib/utils';
  import { handleError } from '$lib/utils/handle-error';
  import { removeSharedLinkAssets, type SharedLinkResponseDto } from '@immich/sdk';
  import { mdiDeleteOutline } from '@mdi/js';
  import ConfirmDialogue from '../../shared-components/confirm-dialogue.svelte';
  import { NotificationType, notificationController } from '../../shared-components/notification/notification';
  import { getAssetControlContext } from '../asset-select-control-bar.svelte';

  export let sharedLink: SharedLinkResponseDto;

  let removing = false;

  const { getAssets, clearSelect } = getAssetControlContext();

  const handleRemove = async () => {
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

<CircleIconButton title="Remove from shared link" on:click={() => (removing = true)} icon={mdiDeleteOutline} />

{#if removing}
  <ConfirmDialogue
    title="Remove Assets?"
    prompt="Are you sure you want to remove {getAssets().size} asset(s) from this shared link?"
    confirmText="Remove"
    on:confirm={() => handleRemove()}
    on:cancel={() => (removing = false)}
  />
{/if}
