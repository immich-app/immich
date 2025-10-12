<script lang="ts">
  import {
    NotificationType,
    notificationController,
  } from '$lib/components/shared-components/notification/notification';
  import { getAssetControlContext } from '$lib/components/timeline/AssetSelectControlBar.svelte';
  import { getAlbumInfo, removeAssetFromAlbum, type AlbumResponseDto } from '@immich/sdk';
  import { IconButton, modalManager } from '@immich/ui';
  import { mdiDeleteOutline, mdiImageRemoveOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import MenuOption from '../../shared-components/context-menu/menu-option.svelte';

  interface Props {
    album: AlbumResponseDto;
    onRemove: ((assetIds: string[]) => void) | undefined;
    menuItem?: boolean;
  }

  let { album = $bindable(), onRemove, menuItem = false }: Props = $props();

  const { getAssets, clearSelect } = getAssetControlContext();

  const removeFromAlbum = async () => {
    const isConfirmed = await modalManager.showDialog({
      prompt: $t('remove_assets_album_confirmation', { values: { count: getAssets().length } }),
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
  <IconButton
    shape="round"
    color="secondary"
    variant="ghost"
    aria-label={$t('remove_from_album')}
    icon={mdiDeleteOutline}
    onclick={removeFromAlbum}
  />
{/if}
