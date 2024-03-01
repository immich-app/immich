<script lang="ts">
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import { getAssetControlContext } from '../asset-select-control-bar.svelte';
  import type { OnStack } from '$lib/utils/actions';
  import { stackAssets } from '$lib/utils/asset-utils';

  export let onStack: OnStack | undefined;

  const { clearSelect, getOwnedAssets } = getAssetControlContext();

  const handleStack = () => {
    stackAssets([...getOwnedAssets()], (ids) => {
      onStack?.(ids);
      clearSelect();
    });
  };
</script>

<MenuOption text="Stack" on:click={handleStack} />
