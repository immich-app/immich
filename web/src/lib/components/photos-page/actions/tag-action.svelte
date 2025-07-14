<script lang="ts">
  import { shortcut } from '$lib/actions/shortcut';
  import { modalManager } from '$lib/managers/modal-manager.svelte';
  import AssetTagModal from '$lib/modals/AssetTagModal.svelte';
  import { IconButton } from '@immich/ui';
  import { mdiTagMultipleOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import MenuOption from '../../shared-components/context-menu/menu-option.svelte';
  import { getAssetControlContext } from '../asset-select-control-bar.svelte';

  interface Props {
    menuItem?: boolean;
  }

  let { menuItem = false }: Props = $props();

  const text = $t('tag');
  const icon = mdiTagMultipleOutline;

  const { clearSelect, getOwnedAssets } = getAssetControlContext();

  const handleTagAssets = async () => {
    const assets = [...getOwnedAssets()];
    const success = await modalManager.show(AssetTagModal, { assetIds: assets.map(({ id }) => id) });

    if (success) {
      clearSelect();
    }
  };
</script>

<svelte:document use:shortcut={{ shortcut: { key: 't' }, onShortcut: handleTagAssets }} />

{#if menuItem}
  <MenuOption {text} {icon} onClick={handleTagAssets} />
{/if}

{#if !menuItem}
  <IconButton shape="round" color="secondary" variant="ghost" aria-label={text} {icon} onclick={handleTagAssets} />
{/if}
