<script lang="ts">
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import {
    NotificationType,
    notificationController,
  } from '$lib/components/shared-components/notification/notification';
  import { getAlbumInfo, removeAssetFromAlbum, type AlbumResponseDto } from '@immich/sdk';
  import { mdiDeleteOutline, mdiImageRemoveOutline } from '@mdi/js';
  import MenuOption from '../../shared-components/context-menu/menu-option.svelte';
  import { getAssetControlContext } from '../asset-select-control-bar.svelte';
  import { s } from '$lib/utils';
  import { dialogController } from '$lib/components/shared-components/dialog/dialog';

  export let album: AlbumResponseDto;
  export let onRemove: ((assetIds: string[]) => void) | undefined;
  export let menuItem = false;

  const { getAssets, clearSelect } = getAssetControlContext();

  const removeFromAlbum = async () => {
    const isConfirmed = await dialogController.show({
      id: 'remove-from-album',
      prompt: `Are you sure you want to remove ${getAssets().size} asset${s(getAssets().size)} from the album?`,
    });

    if (!isConfirmed) {
      return;
    }

    try {
      const ids = [...getAssets()].map((a) => a.id);
      const results = await removeAssetFromAlbum({
        id: album.id,
        bulkIdsDto: { ids },
      });

      album = await getAlbumInfo({ id: album.id });

      onRemove?.(ids);

      const count = results.filter(({ success }) => success).length;
      notificationController.show({
        type: NotificationType.Info,
        message: `Removed ${count} asset${s(count)}`,
      });

      clearSelect();
    } catch (error) {
      console.error('Error [album-viewer] [removeAssetFromAlbum]', error);
      notificationController.show({
        type: NotificationType.Error,
        message: 'Error removing assets from album, check console for more details',
      });
    }
  };
</script>

{#if menuItem}
  <MenuOption text="Remove from album" icon={mdiImageRemoveOutline} on:click={removeFromAlbum} />
{:else}
  <CircleIconButton title="Remove from album" icon={mdiDeleteOutline} on:click={removeFromAlbum} />
{/if}
