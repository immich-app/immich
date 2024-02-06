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
        message: `${count} ressources supprimées`,
      });

      clearSelect();
    } catch (error) {
      handleError(error, 'Impossible de retirer les ressources du lien partagé');
    }
  };
</script>

<CircleIconButton title="Retirer du lien partagé" on:click={() => (removing = true)} icon={mdiDeleteOutline} />

{#if removing}
  <ConfirmDialogue
    title="Retirer les ressources?"
    prompt="Êtes-vous sûr de vouloir retirer {getAssets().size} ressource(s) de ce lien partagé ?"
    confirmText="Retirer"
    on:confirm={() => handleRemove()}
    on:cancel={() => (removing = false)}
  />
{/if}
