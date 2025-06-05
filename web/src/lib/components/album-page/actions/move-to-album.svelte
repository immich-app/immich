<script lang="ts">
  import { getAssetControlContext } from '$lib/components/photos-page/asset-select-control-bar.svelte';
  import AlbumSelectionModal from '$lib/components/shared-components/album-selection/album-selection-modal.svelte';
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import {
    NotificationType,
    notificationController,
  } from '$lib/components/shared-components/notification/notification';
  import { modalManager } from '$lib/managers/modal-manager.svelte';
  import { addAssetsToAlbum, addAssetsToNewAlbum } from '$lib/utils/asset-utils';
  import { getAlbumInfo, removeAssetFromAlbum, type AlbumResponseDto } from '@immich/sdk';
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

  const handleAddToNewAlbum = async (albumName: string) => {
    const assetIds = [...getAssets()].map((asset) => asset.id);

    const isConfirmed = await modalManager.showDialog({
      prompt: $t('move_assets_album_confirmation', { values: { count: assetIds.length } }),
    });

    if (!isConfirmed) {
      return;
    }
    showAlbumPicker = false;
    const newAlbum = await addAssetsToNewAlbum(albumName, assetIds);
    if (!newAlbum) {
      return;
    }

    await removeFromAlbum(assetIds);
  };

  const handleAddToAlbum = async (toAlbum: AlbumResponseDto) => {
    const assetIds = [...getAssets()].map((asset) => asset.id);

    const isConfirmed = await modalManager.showDialog({
      prompt: $t('move_assets_album_confirmation', { values: { count: assetIds.length } }),
      confirmColor: 'warning',
    });
    if (!isConfirmed) {
      return;
    }
    showAlbumPicker = false;
    await addAssetsToAlbum(toAlbum.id, assetIds);
    await removeFromAlbum(assetIds);
  };

  const removeFromAlbum = async (ids: string[]) => {
    try {
      const results = await removeAssetFromAlbum({
        id: album.id,
        bulkIdsDto: { ids },
      });

      album = await getAlbumInfo({ id: album.id });

      onRemove?.(ids);

      const count = results.filter(({ success }) => success).length;
      notificationController.show({
        type: NotificationType.Info,
        message: $t('assets_removed_count', { values: { count } }),
      });

      clearSelect();
      return;
    } catch (error) {
      console.error('Error [album-viewer] [removeAssetFromAlbum]', error);
      notificationController.show({
        type: NotificationType.Error,
        message: $t('errors.error_removing_assets_from_album'),
      });
    }
  };
</script>

<MenuOption onClick={() => (showAlbumPicker = true)} text={$t('move_to_album')} icon={mdiImageMove} />

{#if showAlbumPicker}
  <AlbumSelectionModal
    shared={false}
    onNewAlbum={handleAddToNewAlbum}
    onAlbumClick={handleAddToAlbum}
    onClose={handleHideAlbumPicker}
  />
{/if}
