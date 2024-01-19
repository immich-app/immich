<script lang="ts">
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import type { AssetInteractionStore } from '$lib/stores/asset-interaction.store';

  import { get } from 'svelte/store';
  import { mdiTimerSand, mdiSelectAll } from '@mdi/js';
  import { selectAll } from '$lib/utils/actions';
  import type { AssetStore } from '$lib/stores/assets.store';

  export let assetStore: AssetStore;
  export let assetInteractionStore: AssetInteractionStore;

  let selecting = false;

  const handleSelectAll = async () => {
    selecting = true;

    selectAll(get(assetStore), assetStore, assetInteractionStore);

    selecting = false;
  };
</script>

{#if selecting}
  <CircleIconButton title="Delete" icon={mdiTimerSand} />
{/if}
{#if !selecting}
  <CircleIconButton title="Select all" icon={mdiSelectAll} on:click={handleSelectAll} />
{/if}
