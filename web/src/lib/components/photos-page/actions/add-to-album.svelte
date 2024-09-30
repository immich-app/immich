<script lang="ts">
  import AlbumSelectionModal from '$lib/components/shared-components/album-selection-modal.svelte';
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import { addAssetsToAlbum, addAssetsToNewAlbum } from '$lib/utils/asset-utils';
  import type { AlbumResponseDto } from '@immich/sdk';
  import { getAssetControlContext } from '../asset-select-control-bar.svelte';
  import { mdiImageAlbum, mdiShareVariantOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';

  export let shared = false;

  let showAlbumPicker = false;

  const { getAssets } = getAssetControlContext();

  const handleHideAlbumPicker = () => {
    showAlbumPicker = false;
  };

  const handleAddToNewAlbum = async (albumName: string) => {
    showAlbumPicker = false;

    const assetIds = [...getAssets()].map((asset) => asset.id);
    await addAssetsToNewAlbum(albumName, assetIds);
  };

  const handleAddToAlbum = async (album: AlbumResponseDto) => {
    showAlbumPicker = false;
    const assetIds = [...getAssets()].map((asset) => asset.id);
    await addAssetsToAlbum(album.id, assetIds);
  };
</script>

<MenuOption
  onClick={() => (showAlbumPicker = true)}
  text={shared ? $t('add_to_shared_album') : $t('add_to_album')}
  icon={shared ? mdiShareVariantOutline : mdiImageAlbum}
/>

{#if showAlbumPicker}
  <AlbumSelectionModal
    {shared}
    onNewAlbum={handleAddToNewAlbum}
    onAlbumClick={handleAddToAlbum}
    onClose={handleHideAlbumPicker}
  />
{/if}
