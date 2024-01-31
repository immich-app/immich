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
  export let onRemove: ((assetIds: string[]) => void) | undefined;
  export let menuItem = false;

  const { getAssets, clearSelect } = getAssetControlContext();

  let isShowConfirmation = false;

  const removeFromAlbum = async () => {
    try {
      const ids = [...getAssets()].map((a) => a.id);
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
    } catch (error) {
      console.error('Error [album-viewer] [removeAssetFromAlbum]', error);
      notificationController.show({
        type: NotificationType.Error,
        message: 'Error removing assets from album, check console for more details',
      });
    } finally {
      isShowConfirmation = false;
    }
  };
</script>

{#if menuItem}
  <MenuOption text="Remove from album" on:click={() => (isShowConfirmation = true)} />
{:else}
  <CircleIconButton title="Remove from album" icon={mdiDeleteOutline} on:click={() => (isShowConfirmation = true)} />
{/if}

{#if isShowConfirmation}
  <ConfirmDialogue
    title="Remove from {album.albumName}"
    confirmText="Remove"
    on:confirm={removeFromAlbum}
    on:cancel={() => (isShowConfirmation = false)}
  >
    <svelte:fragment slot="prompt">
      <p>
        Are you sure you want to remove
        {#if getAssets().size > 1}
          these <b>{getAssets().size}</b> assets
        {:else}
          this asset
        {/if}
        from the album?
      </p>
    </svelte:fragment>
  </ConfirmDialogue>
{/if}
