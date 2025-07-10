<script lang="ts">
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import { modalManager } from '$lib/managers/modal-manager.svelte';
  import AlbumPickerModal from '$lib/modals/AlbumPickerModal.svelte';
  import type { OnAddToAlbum } from '$lib/utils/actions';
  import { addAssetsToAlbum } from '$lib/utils/asset-utils';
  import { mdiImageAlbum, mdiShareVariantOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import { getAssetControlContext } from '../asset-select-control-bar.svelte';

  interface Props {
    shared?: boolean;
    onAddToAlbum?: OnAddToAlbum;
  }

  let { shared = false, onAddToAlbum = () => {} }: Props = $props();

  const { getAssets } = getAssetControlContext();

  const onClick = async () => {
    const album = await modalManager.show(AlbumPickerModal, { shared });

    if (!album) {
      return;
    }

    const assetIds = [...getAssets()].map(({ id }) => id);
    await addAssetsToAlbum(album.id, assetIds);
    onAddToAlbum(assetIds, album.id);
  };
</script>

<MenuOption
  {onClick}
  text={shared ? $t('add_to_shared_album') : $t('add_to_album')}
  icon={shared ? mdiShareVariantOutline : mdiImageAlbum}
  shortcut={{ key: 'l', shift: shared }}
/>
