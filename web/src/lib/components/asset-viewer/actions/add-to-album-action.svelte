<script lang="ts">
  import { shortcut } from '$lib/actions/shortcut';
  import type { OnAction } from '$lib/components/asset-viewer/actions/action';
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import { AssetAction } from '$lib/constants';
  import { modalManager } from '$lib/managers/modal-manager.svelte';
  import AlbumPickerModal from '$lib/modals/AlbumPickerModal.svelte';
  import { addAssetsToAlbum } from '$lib/utils/asset-utils';
  import { toTimelineAsset } from '$lib/utils/timeline-util';
  import type { AssetResponseDto } from '@immich/sdk';
  import { mdiImageAlbum, mdiShareVariantOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    asset: AssetResponseDto;
    onAction: OnAction;
    shared?: boolean;
  }

  let { asset, onAction, shared = false }: Props = $props();

  const onClick = async () => {
    const album = await modalManager.show(AlbumPickerModal, { shared });

    if (!album) {
      return;
    }

    await addAssetsToAlbum(album.id, [asset.id]);
    onAction({ type: AssetAction.ADD_TO_ALBUM, asset: toTimelineAsset(asset), album });
  };
</script>

<svelte:document use:shortcut={{ shortcut: { key: 'l', shift: shared }, onShortcut: onClick }} />

<MenuOption
  icon={shared ? mdiShareVariantOutline : mdiImageAlbum}
  text={shared ? $t('add_to_shared_album') : $t('add_to_album')}
  {onClick}
/>
