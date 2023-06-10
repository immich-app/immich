<script lang="ts">
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import {
    NotificationType,
    notificationController
  } from '$lib/components/shared-components/notification/notification';
  import {api, AssetResponseDto} from '@api';
  import SelectAll from 'svelte-material-icons/SelectAll.svelte';
  import TimerSand from 'svelte-material-icons/TimerSand.svelte';
  import {
    assetInteractionStore,
    selectedAssets
  } from '$lib/stores/asset-interaction.store';
  import {assetGridState, assetStore, loadingBucketState} from '$lib/stores/assets.store';
  import ConfirmDialogue from '$lib/components/shared-components/confirm-dialogue.svelte';
  import {handleError} from '../../../utils/handle-error';
  import {AssetGridState} from "$lib/models/asset-grid-state";
  import {sumBy} from "lodash-es";

  let selecting = false;

  const handleSelectAll = async () => {
    try {
      selecting = true;
      let _assetGridState = new AssetGridState();
      assetGridState.subscribe((state) => {
        _assetGridState = state;
      });

      for (let i = 0; i < _assetGridState.buckets.length; i++) {
        await assetStore.getAssetsByBucket(_assetGridState.buckets[i].bucketDate, i)
        for (const asset of _assetGridState.buckets[i].assets) {
          assetInteractionStore.addAssetToMultiselectGroup(asset)
        }
      }
      selecting = false;
    } catch (e) {
      handleError(e, 'Error selecting all assets');
    }
  }

</script>
{#if selecting}
  <CircleIconButton title="Delete" logo={TimerSand}/>
{/if}
{#if !selecting}
  <CircleIconButton title="Select all" logo={SelectAll} on:click={handleSelectAll}/>
{/if}
