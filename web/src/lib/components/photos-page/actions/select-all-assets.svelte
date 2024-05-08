<script lang="ts">
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import type { AssetInteractionStore } from '$lib/stores/asset-interaction.store';
  import { type AssetStore, isSelectingAllAssets } from '$lib/stores/assets.store';
  import { mdiSelectAll, mdiSelectRemove } from '@mdi/js';
  import { selectAllAssets } from '$lib/utils/asset-utils';

  export let assetStore: AssetStore;
  export let assetInteractionStore: AssetInteractionStore;

  const handleSelectAll = async () => {
    await selectAllAssets(assetStore, assetInteractionStore);
  };

  const handleCancel = () => {
    $isSelectingAllAssets = false;
    assetInteractionStore.clearMultiselect();
  };
</script>

{#if $isSelectingAllAssets}
  <CircleIconButton title="Unselect all" icon={mdiSelectRemove} on:click={handleCancel} />
{:else}
  <CircleIconButton title="Select all" icon={mdiSelectAll} on:click={handleSelectAll} />
{/if}
