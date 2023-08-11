<script lang="ts">
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import type { AssetInteractionStore } from '$lib/stores/asset-interaction.store';
  import { BucketPosition, type AssetStore } from '$lib/stores/assets.store';
  import { handleError } from '$lib/utils/handle-error';
  import SelectAll from 'svelte-material-icons/SelectAll.svelte';
  import TimerSand from 'svelte-material-icons/TimerSand.svelte';
  import { get } from 'svelte/store';

  export let assetStore: AssetStore;
  export let assetInteractionStore: AssetInteractionStore;

  let selecting = false;

  const handleSelectAll = async () => {
    try {
      selecting = true;

      const assetGridState = get(assetStore);
      for (const bucket of assetGridState.buckets) {
        await assetStore.loadBucket(bucket.bucketDate, BucketPosition.Unknown);
        for (const asset of bucket.assets) {
          assetInteractionStore.selectAsset(asset);
        }
      }

      selecting = false;
    } catch (e) {
      handleError(e, 'Error selecting all assets');
    }
  };
</script>

{#if selecting}
  <CircleIconButton title="Delete" logo={TimerSand} />
{/if}
{#if !selecting}
  <CircleIconButton title="Select all" logo={SelectAll} on:click={handleSelectAll} />
{/if}
