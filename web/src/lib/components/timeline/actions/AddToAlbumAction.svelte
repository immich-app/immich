<script lang="ts">
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import AlbumPickerModal from '$lib/modals/AlbumPickerModal.svelte';
  import type { OnAddToAlbum } from '$lib/utils/actions';
  import { addAssetsToAlbum, addAssetsToAlbums } from '$lib/utils/asset-utils';
  import { getAssetControlContext } from '$lib/utils/context';
  import { IconButton, modalManager } from '@immich/ui';
  import { mdiImageAlbum, mdiPlus } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    onAddToAlbum?: OnAddToAlbum;
    menuItem?: boolean;
  }

  let { onAddToAlbum = () => {}, menuItem = false }: Props = $props();

  const { getAssets } = getAssetControlContext();

  const onClick = async () => {
    const albums = await modalManager.show(AlbumPickerModal, {});
    if (!albums || albums.length === 0) {
      return;
    }

    const assetIds = [...getAssets()].map(({ id }) => id);
    if (albums.length === 1) {
      const album = albums[0];
      await addAssetsToAlbum(album.id, assetIds);
      onAddToAlbum(assetIds, album.id);
    } else {
      await addAssetsToAlbums(
        albums.map(({ id }) => id),
        assetIds,
      );
      onAddToAlbum(assetIds, albums[0].id);
    }
  };
</script>

{#if menuItem}
  <MenuOption {onClick} text={$t('add_to_album')} icon={mdiImageAlbum} shortcut={{ key: 'l' }} />
{/if}

{#if !menuItem}
  <IconButton
    shape="round"
    color="secondary"
    variant="ghost"
    icon={mdiPlus}
    aria-label={$t('add_to_album')}
    onclick={onClick}
  />
{/if}
