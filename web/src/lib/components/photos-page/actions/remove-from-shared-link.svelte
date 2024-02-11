<script lang="ts">
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import { type SharedLinkResponseDto, api } from '@api';
  import ConfirmDialogue from '../../shared-components/confirm-dialogue.svelte';
  import { getAssetControlContext } from '../asset-select-control-bar.svelte';
  import { NotificationType, notificationController } from '../../shared-components/notification/notification';
  import { handleError } from '../../../utils/handle-error';
  import { mdiDeleteOutline } from '@mdi/js';

  export let sharedLink: SharedLinkResponseDto;

  let removing = false;

  const { getAssets, clearSelect } = getAssetControlContext();

  const handleRemove = async () => {
    try {
      const { data: results } = await api.sharedLinkApi.removeSharedLinkAssets({
        id: sharedLink.id,
        assetIdsDto: {
          assetIds: [...getAssets()].map((asset) => asset.id),
        },
        key: api.getKey(),
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
