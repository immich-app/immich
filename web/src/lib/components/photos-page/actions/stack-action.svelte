<script lang="ts">
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import { getAssetControlContext } from '$lib/components/photos-page/asset-select-control-bar.svelte';
  import { mdiImageMinusOutline, mdiImageMultipleOutline } from '@mdi/js';
  import { stackAssets, unstackAssets } from '$lib/utils/asset-utils';
  import type { OnStack, OnUnstack } from '$lib/utils/actions';
  import { t } from 'svelte-i18n';

  export let unstack = false;
  export let onStack: OnStack | undefined;
  export let onUnstack: OnUnstack | undefined;

  const { clearSelect, getOwnedAssets } = getAssetControlContext();

  const handleStack = async () => {
    const selectedAssets = [...getOwnedAssets()];
    const ids = await stackAssets(selectedAssets);
    if (ids) {
      onStack?.(ids);
      clearSelect();
    }
  };

  const handleUnstack = async () => {
    const selectedAssets = [...getOwnedAssets()];
    if (selectedAssets.length !== 1) {
      return;
    }
    const { stack } = selectedAssets[0];
    if (!stack) {
      return;
    }
    const assets = [selectedAssets[0], ...stack];
    const unstackedAssets = await unstackAssets(assets);
    if (unstackedAssets) {
      onUnstack?.(unstackedAssets);
    }
    clearSelect();
  };
</script>

{#if unstack}
  <MenuOption text={$t('un-stack')} icon={mdiImageMinusOutline} on:click={handleUnstack} />
{:else}
  <MenuOption text={$t('stack')} icon={mdiImageMultipleOutline} on:click={handleStack} />
{/if}
