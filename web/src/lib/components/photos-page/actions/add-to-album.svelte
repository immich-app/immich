<script lang="ts">
  import AlbumSelectionModal from '$lib/components/shared-components/album-selection-modal.svelte';
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import { addAssetsToAlbum, addAssetsToNewAlbum } from '$lib/utils/asset-utils';
  import type { AlbumResponseDto } from '@immich/sdk';
  import { getAssetControlContext } from '../asset-select-control-bar.svelte';
  import { mdiImageAlbum, mdiShareVariantOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import type { OnAddToAlbum } from '$lib/utils/actions';

  interface Props {
    shared?: boolean;
    onAddToAlbum?: OnAddToAlbum;
  }

  let { shared = false, onAddToAlbum = () => {} }: Props = $props();

  let showAlbumPicker = $state(false);

  const { getAssets } = getAssetControlContext();

  const handleHideAlbumPicker = () => {
    showAlbumPicker = false;
  };

  const handleAddToNewAlbum = async (albumName: string) => {
    showAlbumPicker = false;

    const assetIds = [...getAssets()].map((asset) => asset.id);
    const album = await addAssetsToNewAlbum(albumName, assetIds);
    if (!album) {
      return;
    }

    onAddToAlbum(assetIds, album.id);
  };

  const handleAddToAlbum = async (album: AlbumResponseDto) => {
    showAlbumPicker = false;
    const assetIds = [...getAssets()].map((asset) => asset.id);
    await addAssetsToAlbum(album.id, assetIds);
    onAddToAlbum(assetIds, album.id);
  };
</script>

<MenuOption
  onClick={() => (showAlbumPicker = true)}
  text={shared ? $t('add_to_shared_album') : $t('add_to_album')}
  icon={shared ? mdiShareVariantOutline : mdiImageAlbum}
  shortcut={{ key: 'l', shift: shared }}
/>

{#if showAlbumPicker}
  <AlbumSelectionModal
    {shared}
    onNewAlbum={handleAddToNewAlbum}
    onAlbumClick={handleAddToAlbum}
    onClose={handleHideAlbumPicker}
  />
{/if}
