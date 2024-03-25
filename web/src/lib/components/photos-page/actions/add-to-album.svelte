<script lang="ts">
  import { goto } from '$app/navigation';
  import AlbumSelectionModal from '$lib/components/shared-components/album-selection-modal.svelte';
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import {
    NotificationType,
    notificationController,
  } from '$lib/components/shared-components/notification/notification';
  import { AppRoute } from '$lib/constants';
  import { addAssetsToAlbum } from '$lib/utils/asset-utils';
  import { createAlbum, type AlbumResponseDto } from '@immich/sdk';
  import { getMenuContext } from '../asset-select-context-menu.svelte';
  import { getAssetControlContext } from '../asset-select-control-bar.svelte';
  import { mdiImageAlbum, mdiShareVariantOutline } from '@mdi/js';
  import ConfirmDialogue from '$lib/components/shared-components/confirm-dialogue.svelte';

  export let shared = false;

  let showAlbumPicker = false;
  let createdAlbum: AlbumResponseDto | null = null;

  const { getAssets, clearSelect } = getAssetControlContext();
  const closeMenu = getMenuContext();

  const handleHideAlbumPicker = () => {
    showAlbumPicker = false;
    closeMenu();
  };

  const handleAddToNewAlbum = async (albumName: string) => {
    showAlbumPicker = false;

    const assetIds = [...getAssets()].map((asset) => asset.id);

    try {
      const album = await createAlbum({ createAlbumDto: { albumName, assetIds } });

      notificationController.show({
        message: `Added ${assetIds.length} to ${album.albumName}`,
        type: NotificationType.Info,
      });

      createdAlbum = album;
    } catch (error) {
      console.error(`[add-to-album.svelte]:handleAddToNewAlbum ${error}`, error);
    }
  };

  const goToNewAlbum = async () => {
    clearSelect();
    if (createdAlbum) {
      await goto(`${AppRoute.ALBUMS}/${createdAlbum.id}`);
    }
  };

  const closeNewAlbumDialog = () => {
    createdAlbum = null;
    clearSelect();
  };

  const handleAddToAlbum = async (album: AlbumResponseDto) => {
    showAlbumPicker = false;
    const assetIds = [...getAssets()].map((asset) => asset.id);
    await addAssetsToAlbum(album.id, assetIds);
    clearSelect();
  };
</script>

<MenuOption
  on:click={() => (showAlbumPicker = true)}
  text={shared ? 'Add to shared album' : 'Add to album'}
  icon={shared ? mdiShareVariantOutline : mdiImageAlbum}
/>

{#if showAlbumPicker}
  <AlbumSelectionModal
    {shared}
    on:newAlbum={({ detail }) => handleAddToNewAlbum(detail)}
    on:album={({ detail }) => handleAddToAlbum(detail)}
    on:close={handleHideAlbumPicker}
  />
{/if}

{#if createdAlbum}
  <ConfirmDialogue
    title="Album Created"
    confirmText="Go To Album"
    confirmColor="primary"
    cancelText="Stay Here"
    cancelColor="secondary"
    onConfirm={() => goToNewAlbum()}
    onClose={() => closeNewAlbumDialog()}
  >
    <svelte:fragment slot="prompt">
      <p>The album <b>{createdAlbum.albumName}</b> has been created.</p>
      <p>What would you like to do?</p>
    </svelte:fragment>
  </ConfirmDialogue>
{/if}
