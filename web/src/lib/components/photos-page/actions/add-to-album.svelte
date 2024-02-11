<script lang="ts">
  import { goto } from '$app/navigation';
  import AlbumSelectionModal from '$lib/components/shared-components/album-selection-modal.svelte';
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import {
    NotificationType,
    notificationController,
  } from '$lib/components/shared-components/notification/notification';
  import { addAssetsToAlbum } from '$lib/utils/asset-utils';
  import { type AlbumResponseDto, api } from '@api';
  import { getMenuContext } from '../asset-select-context-menu.svelte';
  import { getAssetControlContext } from '../asset-select-control-bar.svelte';
  import { AppRoute } from '$lib/constants';

  export let shared = false;
  let showAlbumPicker = false;

  const { getAssets, clearSelect } = getAssetControlContext();
  const closeMenu = getMenuContext();

  const handleHideAlbumPicker = () => {
    showAlbumPicker = false;
    closeMenu();
  };

  const handleAddToNewAlbum = (albumName: string) => {
    showAlbumPicker = false;

    const assetIds = [...getAssets()].map((asset) => asset.id);
    api.albumApi.createAlbum({ createAlbumDto: { albumName, assetIds } }).then((response) => {
      const { id, albumName } = response.data;

      notificationController.show({
        message: `Added ${assetIds.length} to ${albumName}`,
        type: NotificationType.Info,
      });

      clearSelect();

      goto(`${AppRoute.ALBUMS}/${id}`);
    });
  };

  const handleAddToAlbum = async (album: AlbumResponseDto) => {
    showAlbumPicker = false;
    const assetIds = [...getAssets()].map((asset) => asset.id);
    await addAssetsToAlbum(album.id, assetIds);
    clearSelect();
  };
</script>

<MenuOption on:click={() => (showAlbumPicker = true)} text={shared ? 'Add to Shared Album' : 'Add to Album'} />

{#if showAlbumPicker}
  <AlbumSelectionModal
    {shared}
    on:newAlbum={({ detail }) => handleAddToNewAlbum(detail)}
    on:album={({ detail }) => handleAddToAlbum(detail)}
    on:close={handleHideAlbumPicker}
  />
{/if}
