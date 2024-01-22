<script lang="ts">
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import ConfirmDialogue from '$lib/components/shared-components/confirm-dialogue.svelte';
  import {
    NotificationType,
    notificationController,
  } from '$lib/components/shared-components/notification/notification';
  import { type AlbumResponseDto, api } from '@api';
  import MenuOption from '../../shared-components/context-menu/menu-option.svelte';
  import { getAssetControlContext } from '../asset-select-control-bar.svelte';
  import { mdiDeleteOutline } from '@mdi/js';

  export let album: AlbumResponseDto;
  export let onRemove: ((assetIds: string[]) => void) | undefined = undefined;
  export let menuItem = false;

  const { getAssets, clearSelect } = getAssetControlContext();

  let isShowConfirmation = false;

  const removeFromAlbum = async () => {
    try {
      const ids = Array.from(getAssets()).map((a) => a.id);
      const { data: results } = await api.albumApi.removeAssetFromAlbum({
        id: album.id,
        bulkIdsDto: { ids },
      });

      const { data } = await api.albumApi.getAlbumInfo({ id: album.id });
      album = data;

      onRemove?.(ids);

      const count = results.filter(({ success }) => success).length;
      notificationController.show({
        type: NotificationType.Info,
        message: `Removed ${count} asset${count === 1 ? '' : 's'}`,
      });

      clearSelect();
    } catch (e) {
      console.error('Error [album-viewer] [removeAssetFromAlbum]', e);
      notificationController.show({
        type: NotificationType.Error,
        message: "Erreur lors de la suppression des ressources de l'album, contactez votre admnistrateur.",
      });
    } finally {
      isShowConfirmation = false;
    }
  };
</script>

{#if menuItem}
  <MenuOption text="Retirer de l'album" on:click={() => (isShowConfirmation = true)} />
{:else}
  <CircleIconButton title="Retirer de l'album" icon={mdiDeleteOutline} on:click={() => (isShowConfirmation = true)} />
{/if}

{#if isShowConfirmation}
  <ConfirmDialogue
    title="Retirer de {album.albumName}"
    confirmText="Retirer"
    on:confirm={removeFromAlbum}
    on:cancel={() => (isShowConfirmation = false)}
  >
    <svelte:fragment slot="prompt">
      <p>
        Êtes-vous sûr de vouloir retirer
        {#if getAssets().size > 1}
          ces  <b>{getAssets().size}</b> ressources
        {:else}
          cette ressource
        {/if}
        de l'album ?
      </p>
    </svelte:fragment>
  </ConfirmDialogue>
{/if}
