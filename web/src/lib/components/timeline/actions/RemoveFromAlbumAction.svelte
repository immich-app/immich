<script lang="ts">
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import { assetMultiSelectManager } from '$lib/managers/asset-multi-select-manager.svelte';
  import { handleError } from '$lib/utils/handle-error';
  import { getAlbumInfo, removeAssetFromAlbum, type AlbumResponseDto } from '@immich/sdk';
  import { IconButton, modalManager, toastManager } from '@immich/ui';
  import { mdiDeleteOutline, mdiImageRemoveOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    album: AlbumResponseDto;
    onRemove: ((assetIds: string[]) => void) | undefined;
    assetIds?: string[];
    menuItem?: boolean;
  }

  let { album = $bindable(), onRemove, assetIds, menuItem = false }: Props = $props();

  const removeFromAlbum = async () => {
    const ids = assetIds ?? assetMultiSelectManager.assets.map(({ id }) => id) ?? [];

    const isConfirmed = await modalManager.showDialog({
      prompt: $t('remove_assets_album_confirmation', { values: { count: ids.length } }),
    });

    if (!isConfirmed) {
      return;
    }

    try {
      const results = await removeAssetFromAlbum({
        id: album.id,
        bulkIdsDto: { ids },
      });

      album = await getAlbumInfo({ id: album.id });

      onRemove?.(ids);

      const count = results.filter(({ success }) => success).length;
      toastManager.primary($t('assets_removed_count', { values: { count } }));

      assetMultiSelectManager.clear();
    } catch (error) {
      handleError(error, $t('errors.error_removing_assets_from_album'));
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
