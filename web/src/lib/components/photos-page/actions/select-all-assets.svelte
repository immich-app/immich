<script lang="ts">
  import { get } from 'svelte/store';
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import SelectAll from 'svelte-material-icons/SelectAll.svelte';
  import TimerSand from 'svelte-material-icons/TimerSand.svelte';
  import { handleError } from '../../../utils/handle-error';
  import { BucketPosition } from '$lib/models/asset-grid-state';
  import type { AssetStore } from '$lib/stores/assets.store';
  import type { AssetInteractionStore } from '$lib/stores/asset-interaction.store';

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
          assetInteractionStore.addAssetToMultiselectGroup(asset);
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
