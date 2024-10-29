<script lang="ts">
  import type { OnAction } from '$lib/components/asset-viewer/actions/action';
  import AlbumSelectionModal from '$lib/components/shared-components/album-selection-modal.svelte';
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import Portal from '$lib/components/shared-components/portal/portal.svelte';
  import { AssetAction } from '$lib/constants';
  import { addAssetsToAlbum, addAssetsToNewAlbum } from '$lib/utils/asset-utils';
  import type { AlbumResponseDto, AssetResponseDto } from '@immich/sdk';
  import { mdiImageAlbum, mdiShareVariantOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';

  export let asset: AssetResponseDto;
  export let onAction: OnAction;
  export let shared = false;

  let showSelectionModal = false;

  const handleAddToNewAlbum = async (albumName: string) => {
    showSelectionModal = false;
    const album = await addAssetsToNewAlbum(albumName, [asset.id]);
    if (album) {
      onAction({ type: AssetAction.ADD_TO_ALBUM, asset, album });
    }
  };

  const handleAddToAlbum = async (album: AlbumResponseDto) => {
    showSelectionModal = false;
    await addAssetsToAlbum(album.id, [asset.id]);
    onAction({ type: AssetAction.ADD_TO_ALBUM, asset, album });
  };
</script>

<MenuOption
  icon={shared ? mdiShareVariantOutline : mdiImageAlbum}
  text={shared ? $t('add_to_shared_album') : $t('add_to_album')}
  onClick={() => (showSelectionModal = true)}
/>

{#if showSelectionModal}
  <Portal target="body">
    <AlbumSelectionModal
      {shared}
      onNewAlbum={handleAddToNewAlbum}
      onAlbumClick={handleAddToAlbum}
      onClose={() => (showSelectionModal = false)}
    />
  </Portal>
{/if}
