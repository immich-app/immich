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
  import { dialogController } from '$lib/components/shared-components/dialog/dialog';
  import { t } from 'svelte-i18n';

  export let album: AlbumResponseDto;
  export let onRemove: ((assetIds: string[]) => void) | undefined;
  export let menuItem = false;

  const { getAssets, clearSelect } = getAssetControlContext();

  const removeFromAlbum = async () => {
    const isConfirmed = await dialogController.show({
      prompt: $t('remove_assets_album_confirmation', { values: { count: getAssets().size } }),
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
        message: $t('assets_removed_count', { values: { count } }),
      });

      clearSelect();
    } catch (error) {
      console.error('Error [album-viewer] [removeAssetFromAlbum]', error);
      notificationController.show({
        type: NotificationType.Error,
        message: $t('errors.error_removing_assets_from_album'),
      });
    }
  };
</script>

{#if menuItem}
  <MenuOption text={$t('remove_from_album')} icon={mdiImageRemoveOutline} onClick={removeFromAlbum} />
{:else}
  <CircleIconButton title={$t('remove_from_album')} icon={mdiDeleteOutline} on:click={removeFromAlbum} />
{/if}
