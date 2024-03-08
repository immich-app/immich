<script lang="ts">
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import type { AssetInteractionStore } from '$lib/stores/asset-interaction.store';
  import { BucketPosition, type AssetStore, isSelectAllCancelled } from '$lib/stores/assets.store';
  import { handleError } from '$lib/utils/handle-error';
  import { get } from 'svelte/store';
  import { mdiTimerSand, mdiSelectAll } from '@mdi/js';

  export let assetStore: AssetStore;
  export let assetInteractionStore: AssetInteractionStore;

  let selecting = false;

  const handleSelectAll = async () => {
    try {
      $isSelectAllCancelled = false;
      selecting = true;

      const assetGridState = get(assetStore);
      for (const bucket of assetGridState.buckets) {
        if ($isSelectAllCancelled) {
          break;
        }
        await assetStore.loadBucket(bucket.bucketDate, BucketPosition.Unknown);
        for (const asset of bucket.assets) {
          assetInteractionStore.selectAsset(asset);
        }
      }

      selecting = false;
    } catch (error) {
      handleError(error, 'Error selecting all assets');
    }
  };
</script>

{#if selecting}
  <CircleIconButton title="Delete" icon={mdiTimerSand} />
{/if}
{#if !selecting}
  <CircleIconButton title="Select all" icon={mdiSelectAll} on:click={handleSelectAll} />
{/if}
