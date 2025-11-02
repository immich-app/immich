<script lang="ts">
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import { getAssetControlContext } from '$lib/components/timeline/AssetSelectControlBar.svelte';
  import AlbumPickerModal from '$lib/modals/AlbumPickerModal.svelte';
  import type { OnAddToAlbum } from '$lib/utils/actions';
  import { moveAssetsToAlbum } from '$lib/utils/asset-utils';
  import { modalManager } from '@immich/ui';
  import { mdiImageAlbum } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    onAddToAlbum?: OnAddToAlbum;
    asset?: { id: string } | undefined;
    showShortcut?: boolean;
  }

  let { onAddToAlbum = () => {}, asset = undefined, showShortcut = true }: Props = $props();

  let getAssets: (() => { id: string }[]) | undefined;
  try {
    ({ getAssets } = getAssetControlContext());
  } catch (e) {
    getAssets = undefined;
  }

  const onClick = async () => {
    const albums = await modalManager.show(AlbumPickerModal, { shared: false, titleKey: 'move_to_album' });
    if (!albums || albums.length === 0) {
      return;
    }

    const assetIds = getAssets ? [...getAssets()].map(({ id }) => id) : asset ? [asset.id] : [];
    if (assetIds.length === 0) {
      return;
    }
    const album = albums[0];
    await moveAssetsToAlbum(album.id, assetIds);
    onAddToAlbum(assetIds, album.id);
  };
</script>

{#if showShortcut}
  <MenuOption {onClick} text={$t('move_to_album')} icon={mdiImageAlbum} shortcut={{ key: 'm' }} />
{:else}
  <MenuOption {onClick} text={$t('move_to_album')} icon={mdiImageAlbum} />
{/if}
