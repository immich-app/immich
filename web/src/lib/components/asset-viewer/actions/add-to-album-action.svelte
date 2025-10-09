<script lang="ts">
  import { shortcut } from '$lib/actions/shortcut';
  import type { OnAction } from '$lib/components/asset-viewer/actions/action';
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import { AssetAction } from '$lib/constants';
  import AlbumPickerModal from '$lib/modals/AlbumPickerModal.svelte';
  import { addAssetsToAlbum, addAssetsToAlbums } from '$lib/utils/asset-utils';
  import { toTimelineAsset } from '$lib/utils/timeline-util';
  import type { AssetResponseDto } from '@immich/sdk';
  import { modalManager } from '@immich/ui';
  import { mdiImageAlbum, mdiShareVariantOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    asset: AssetResponseDto;
    onAction: OnAction;
    shared?: boolean;
  }

  let { asset, onAction, shared = false }: Props = $props();

  const onClick = async () => {
    const albums = await modalManager.show(AlbumPickerModal, { shared });

    if (!albums || albums.length === 0) {
      return;
    }

    if (albums.length === 1) {
      const album = albums[0];
      await addAssetsToAlbum(album.id, [asset.id]);
      onAction({ type: AssetAction.ADD_TO_ALBUM, asset: toTimelineAsset(asset), album });
    } else {
      await addAssetsToAlbums(
        albums.map((a) => a.id),
        [asset.id],
      );
      onAction({ type: AssetAction.ADD_TO_ALBUM, asset: toTimelineAsset(asset), album: albums[0] });
    }
  };
</script>

<svelte:document use:shortcut={{ shortcut: { key: 'l', shift: shared }, onShortcut: onClick }} />

<MenuOption
  icon={shared ? mdiShareVariantOutline : mdiImageAlbum}
  text={shared ? $t('add_to_shared_album') : $t('add_to_album')}
  {onClick}
/>
