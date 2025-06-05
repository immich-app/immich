<script lang="ts">
  import { goto } from '$app/navigation';
  import { getAssetControlContext } from '$lib/components/photos-page/asset-select-control-bar.svelte';
  import AlbumSelectionModal from '$lib/components/shared-components/album-selection/album-selection-modal.svelte';
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import {
    NotificationType,
    notificationController,
  } from '$lib/components/shared-components/notification/notification';
  import { AppRoute } from '$lib/constants';
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

  const handleMoveToNewAlbum = async (albumName: string) => {
    const assetIds = [...getAssets()].map((asset) => asset.id);

    const isConfirmed = await modalManager.showDialog({
      prompt: $t('move_assets_album_confirmation', {
        values: { count: assetIds.length, fromAlbum: album.albumName, toAlbum: albumName ?? ' ' },
      }),
    });
    if (!isConfirmed) {
      return;
    }

    showAlbumPicker = false;
    const newAlbum = await addAssetsToNewAlbum(albumName, assetIds);
    if (!newAlbum) {
      return;
    }

    await removeFromAlbum(assetIds, newAlbum);
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
    await addAssetsToAlbum(toAlbum.id, assetIds, false);
    await removeFromAlbum(assetIds, toAlbum);
  };

  const removeFromAlbum = async (ids: string[], toAlbum: AlbumResponseDto) => {
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
        message: $t('assets_moved_to_album_count', {
          values: { count, fromAlbum: album.albumName, toAlbum: toAlbum.albumName },
        }),
        button: {
          text: $t('view_album'),
          onClick() {
            return goto(`${AppRoute.ALBUMS}/${toAlbum.id}`);
          },
        },
      });

      clearSelect();
      return;
    } catch (error) {
      console.error('Error [album-viewer] [move-to-album] [removeAssetFromAlbum]', error);
      notificationController.show({
        type: NotificationType.Error,
        message: $t('errors.error_removing_assets_from_album'),
      });
    }
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
    move
    onNewAlbum={handleMoveToNewAlbum}
    onAlbumClick={handleMoveToAlbum}
    onClose={handleHideAlbumPicker}
  />
{/if}
