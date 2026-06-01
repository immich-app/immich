<script lang="ts">
  import MenuOption from '$lib/components/shared-components/context-menu/MenuOption.svelte';
  import { assetMultiSelectManager } from '$lib/managers/asset-multi-select-manager.svelte';
  import AlbumPickerModal from '$lib/modals/AlbumPickerModal.svelte';
  import { addAssetsToAlbums } from '$lib/services/album.service';
  import { handleError } from '$lib/utils/handle-error';
  import { getAlbumInfo, removeAssetFromAlbum, type AlbumResponseDto } from '@immich/sdk';
  import { modalManager, toastManager } from '@immich/ui';
  import { mdiFolderMove } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    album: AlbumResponseDto;
    onMove: ((assetIds: string[]) => void) | undefined;
    assetIds?: string[];
    menuItem?: boolean;
  }

  let { album = $bindable(), onMove, assetIds, menuItem = false }: Props = $props();

  const moveToAlbum = async () => {
    const ids = assetIds ?? assetMultiSelectManager.assets.map(({ id }) => id) ?? [];
    if (ids.length === 0) {
      return;
    }

    modalManager.show(AlbumPickerModal, {
      title: $t('move_to_album'),
      onClose: async (targetAlbums) => {
        if (!targetAlbums || targetAlbums.length === 0) {
          return;
        }

        // Filter out the current album from targets to prevent moving to itself
        const targetAlbumIds = targetAlbums.map((a) => a.id).filter((id) => id !== album.id);
        if (targetAlbumIds.length === 0) {
          toastManager.warning($t('errors.cannot_move_to_same_album'));
          return;
        }

        try {
          // 1. Add assets to target album(s) without triggering 'added to album' toast
          const addSuccess = await addAssetsToAlbums(targetAlbumIds, ids, { notify: false });
          if (!addSuccess) {
            return;
          }

          // 2. Remove assets from current source album
          await removeAssetFromAlbum({
            id: album.id,
            bulkIdsDto: { ids },
          });

          // 3. Update current album info/state
          album = await getAlbumInfo({ id: album.id });

          // 4. Notify parent to update timeline assets
          onMove?.(ids);

          // 5. Show toast notification
          const targetAlbumNames = targetAlbums.map((a) => a.albumName || $t('unnamed_album')).join(', ');
          toastManager.primary(
            $t('assets_moved_to_album', { values: { count: ids.length, album: targetAlbumNames } })
          );

          assetMultiSelectManager.clear();
        } catch (error) {
          handleError(error, $t('errors.error_moving_assets'));
        }
      },
    });
  };
</script>

{#if menuItem}
  <MenuOption text={$t('move_to_album')} icon={mdiFolderMove} onClick={moveToAlbum} />
{/if}
