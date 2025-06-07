<script lang="ts">
  import { getAssetControlContext } from '$lib/components/photos-page/asset-select-control-bar.svelte';
  import AlbumSelectionModal from '$lib/components/shared-components/album-selection/album-selection-modal.svelte';
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import { modalManager } from '$lib/managers/modal-manager.svelte';
  import { moveAssetsToAlbum, moveAssetsToNewAlbum } from '$lib/utils/asset-utils';
  import { type AlbumResponseDto } from '@immich/sdk';
  import { mdiImageMove } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    album: AlbumResponseDto;
    onRemove: ((assetIds: string[]) => void) | undefined;
  }

  let { album = $bindable(), onRemove }: Props = $props();

  let showAlbumPicker = $state(false);

  const { getAssets, clearSelect } = getAssetControlContext();

  const handleHideAlbumPicker = () => {
    showAlbumPicker = false;
  };

  const handleMoveToNewAlbum = async (albumName: string) => {
    const assetIds = [...getAssets()].map((asset) => asset.id);

    const isConfirmed = await modalManager.showDialog({
      prompt: $t('move_assets_album_confirmation', {
        values: { count: assetIds.length, fromAlbum: album.albumName, toAlbum: albumName ?? ' ' },
      }),
      confirmColor: 'warning',
    });
    if (!isConfirmed) {
      return;
    }
    showAlbumPicker = false;

    const removedIds = (await moveAssetsToNewAlbum(album, albumName, assetIds)) ?? [];
    clearSelect();
    onRemove?.(removedIds);
  };

  const handleMoveToAlbum = async (toAlbum: AlbumResponseDto) => {
    const assetIds = [...getAssets()].map((asset) => asset.id);

    const isConfirmed = await modalManager.showDialog({
      prompt: $t('move_assets_album_confirmation', {
        values: { count: assetIds.length, fromAlbum: album.albumName, toAlbum: toAlbum.albumName },
      }),
      confirmColor: 'warning',
    });
    if (!isConfirmed) {
      return;
    }
    showAlbumPicker = false;

    const removedIds = await moveAssetsToAlbum(album, toAlbum, assetIds);
    clearSelect();
    onRemove?.(removedIds);
  };
</script>

<MenuOption
  onClick={() => (showAlbumPicker = true)}
  text={$t('move_to_album')}
  icon={mdiImageMove}
  shortcut={{ key: 'l', shift: true, ctrl: true }}
/>

{#if showAlbumPicker}
  <AlbumSelectionModal
    shared={false}
    moveFromAlbum={album}
    onNewAlbum={handleMoveToNewAlbum}
    onAlbumClick={handleMoveToAlbum}
    onClose={handleHideAlbumPicker}
  />
{/if}
