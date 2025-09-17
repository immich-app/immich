<script lang="ts">
  import { shortcut } from '$lib/actions/shortcut';
  import { getAssetControlContext } from '$lib/components/timeline/AssetSelectControlBar.svelte';
  import AssetTagModal from '$lib/modals/AssetTagModal.svelte';
  import { IconButton, modalManager } from '@immich/ui';
  import { mdiTagMultipleOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import MenuOption from '../../shared-components/context-menu/menu-option.svelte';

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
