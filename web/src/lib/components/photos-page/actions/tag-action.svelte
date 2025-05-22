<script lang="ts">
  import { shortcut } from '$lib/actions/shortcut';
  import TagAssetForm from '$lib/components/forms/tag-asset-form.svelte';
  import { tagAssets } from '$lib/utils/asset-utils';
  import { mdiTagMultipleOutline, mdiTimerSand } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import { IconButton } from '@immich/ui';
  import MenuOption from '../../shared-components/context-menu/menu-option.svelte';
  import { getAssetControlContext } from '../asset-select-control-bar.svelte';

  interface Props {
    menuItem?: boolean;
  }

  let { menuItem = false }: Props = $props();

  const text = $t('tag');
  const icon = mdiTagMultipleOutline;

  let loading = $state(false);
  let isOpen = $state(false);

  const { clearSelect, getOwnedAssets } = getAssetControlContext();

  const handleOpen = () => (isOpen = true);
  const handleCancel = () => (isOpen = false);
  const handleTag = async (tagIds: string[]) => {
    const assets = [...getOwnedAssets()];
    loading = true;
    const ids = await tagAssets({ tagIds, assetIds: assets.map((asset) => asset.id) });
    if (ids) {
      clearSelect();
    }
    loading = false;
  };
</script>

<svelte:document use:shortcut={{ shortcut: { key: 't' }, onShortcut: () => (isOpen = true) }} />

{#if menuItem}
  <MenuOption {text} {icon} onClick={handleOpen} />
{/if}

{#if !menuItem}
  {#if loading}
    <IconButton
      shape="round"
      color="secondary"
      variant="ghost"
      aria-label={$t('loading')}
      icon={mdiTimerSand}
      onclick={() => {}}
    />
  {:else}
    <IconButton shape="round" color="secondary" variant="ghost" aria-label={text} {icon} onclick={handleOpen} />
  {/if}
{/if}

{#if isOpen}
  <TagAssetForm onTag={(tagIds) => handleTag(tagIds)} onCancel={handleCancel} />
{/if}
