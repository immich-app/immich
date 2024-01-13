<script lang="ts">
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import { OnStack, getAssetControlContext } from '../asset-select-control-bar.svelte';
  import { stackAssets } from '$lib/utils/asset-utils';

  export let onStack: OnStack | undefined = undefined;

  const { clearSelect, getOwnedAssets } = getAssetControlContext();

  const handleStack = () => {
    stackAssets(Array.from(getOwnedAssets()), (ids) => {
      onStack?.(ids);
      clearSelect();
    });
  };
</script>

<MenuOption text="Stack" on:click={handleStack} />
