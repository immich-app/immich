<script lang="ts">
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import { getAssetControlContext } from '$lib/components/photos-page/asset-select-control-bar.svelte';
  import { mdiImageMinusOutline, mdiImageMultipleOutline } from '@mdi/js';
  import { stackAssets, deleteStack } from '$lib/utils/asset-utils';
  import type { OnStack, OnUnstack } from '$lib/utils/actions';
  import { t } from 'svelte-i18n';

  interface Props {
    unstack?: boolean;
    onStack: OnStack | undefined;
    onUnstack: OnUnstack | undefined;
  }

  let { unstack = false, onStack, onUnstack }: Props = $props();

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
    const unstackedAssets = await deleteStack([stack.id]);
    if (unstackedAssets) {
      onUnstack?.(unstackedAssets);
    }
    clearSelect();
  };
</script>

{#if unstack}
  <MenuOption text={$t('unstack')} icon={mdiImageMinusOutline} onClick={handleUnstack} />
{:else}
  <MenuOption text={$t('stack')} icon={mdiImageMultipleOutline} onClick={handleStack} />
{/if}
