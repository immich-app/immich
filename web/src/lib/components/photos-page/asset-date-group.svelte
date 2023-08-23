<script lang="ts">
  import { locale } from '$lib/stores/preferences.store';
  import { getAssetRatio } from '$lib/utils/asset-utils';
  import { formatGroupTitle, splitBucketIntoDateGroups } from '$lib/utils/timeline-util';
  import type { AssetResponseDto } from '@api';
  import justifiedLayout from 'justified-layout';
  import { DateTime } from 'luxon';
  import { createEventDispatcher } from 'svelte';
  import CheckCircle from 'svelte-material-icons/CheckCircle.svelte';
  import CircleOutline from 'svelte-material-icons/CircleOutline.svelte';
  import { fly } from 'svelte/transition';
  import Thumbnail from '../assets/thumbnail/thumbnail.svelte';
  import { assetViewingStore } from '$lib/stores/asset-viewing.store';
  import type { AssetStore } from '$lib/stores/assets.store';
  import type { AssetInteractionStore } from '$lib/stores/asset-interaction.store';
  import type { Viewport } from '$lib/stores/assets.store';

  export let assets: AssetResponseDto[];
  export let bucketDate: string;
  export let bucketHeight: number;
  export let isSelectionMode = false;
  export let viewport: Viewport;
  export let singleSelect = false;
  export let publicSharedKey: string | undefined = undefined;

  export let assetStore: AssetStore;
  export let assetInteractionStore: AssetInteractionStore;

  const { selectedGroup, selectedAssets, assetSelectionCandidates, isMultiSelectState } = assetInteractionStore;
  const dispatch = createEventDispatcher<{
    select: { title: string; assets: AssetResponseDto[] };
    selectAssets: AssetResponseDto;
    selectAssetCandidates: AssetResponseDto | null;
    shift: { heightDelta: number };
  }>();

  let isMouseOverGroup = false;
  let actualBucketHeight: number;
  let hoveredDateGroup = '';

  interface LayoutBox {
    top: number;
    left: number;
    width: number;
  }

  $: assetsGroupByDate = splitBucketIntoDateGroups(assets, $locale);

  $: geometry = (() => {
    const geometry = [];
    for (let group of assetsGroupByDate) {
      const justifiedLayoutResult = justifiedLayout(group.map(getAssetRatio), {
        boxSpacing: 2,
        containerWidth: Math.floor(viewport.width),
        containerPadding: 0,
        targetRowHeightTolerance: 0.15,
        targetRowHeight: 235,
      });
      geometry.push({
        ...justifiedLayoutResult,
        containerWidth: calculateWidth(justifiedLayoutResult.boxes),
      });
    }
    return geometry;
  })();

  $: {
    if (actualBucketHeight && actualBucketHeight !== 0 && actualBucketHeight != bucketHeight) {
      const heightDelta = assetStore.updateBucket(bucketDate, actualBucketHeight);
      if (heightDelta !== 0) {
        scrollTimeline(heightDelta);
      }
    }
  }

  function scrollTimeline(heightDelta: number) {
    dispatch('shift', {
      heightDelta,
    });
  }

  const calculateWidth = (boxes: LayoutBox[]): number => {
    let width = 0;
    for (const box of boxes) {
      if (box.top < 100) {
        width = box.left + box.width;
      }
    }

    return width;
  };

  const assetClickHandler = (asset: AssetResponseDto, assetsInDateGroup: AssetResponseDto[], groupTitle: string) => {
    if (isSelectionMode || $isMultiSelectState) {
      assetSelectHandler(asset, assetsInDateGroup, groupTitle);
      return;
    }

    assetViewingStore.setAssetId(asset.id, publicSharedKey);
  };

  const handleSelectGroup = (title: string, assets: AssetResponseDto[]) => dispatch('select', { title, assets });

  const assetSelectHandler = (asset: AssetResponseDto, assetsInDateGroup: AssetResponseDto[], groupTitle: string) => {
    dispatch('selectAssets', asset);

    // Check if all assets are selected in a group to toggle the group selection's icon
    let selectedAssetsInGroupCount = assetsInDateGroup.filter((asset) => $selectedAssets.has(asset)).length;

    // if all assets are selected in a group, add the group to selected group
    if (selectedAssetsInGroupCount == assetsInDateGroup.length) {
      assetInteractionStore.addGroupToMultiselectGroup(groupTitle);
    } else {
      assetInteractionStore.removeGroupFromMultiselectGroup(groupTitle);
    }
  };

  const assetMouseEventHandler = (groupTitle: string, asset: AssetResponseDto | null) => {
    // Show multi select icon on hover on date group
    hoveredDateGroup = groupTitle;

    if ($isMultiSelectState) {
      dispatch('selectAssetCandidates', asset);
    }
  };
</script>

<section id="asset-group-by-date" class="flex flex-wrap gap-x-12" bind:clientHeight={actualBucketHeight}>
  {#each assetsGroupByDate as groupAssets, groupIndex (groupAssets[0].id)}
    {@const groupTitle = formatGroupTitle(DateTime.fromISO(groupAssets[0].fileCreatedAt).startOf('day'))}
    <!-- Asset Group By Date -->

    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div
      class="mt-5 flex flex-col"
      on:mouseenter={() => {
        isMouseOverGroup = true;
        assetMouseEventHandler(groupTitle, null);
      }}
      on:mouseleave={() => {
        isMouseOverGroup = false;
        assetMouseEventHandler(groupTitle, null);
      }}
    >
      <!-- Date group title -->
      <p
        class="mb-2 flex h-6 place-items-center text-xs font-medium text-immich-fg dark:text-immich-dark-fg md:text-sm"
        style="width: {geometry[groupIndex].containerWidth}px"
      >
        {#if !singleSelect && ((hoveredDateGroup == groupTitle && isMouseOverGroup) || $selectedGroup.has(groupTitle))}
          <div
            transition:fly={{ x: -24, duration: 200, opacity: 0.5 }}
            class="inline-block px-2 hover:cursor-pointer"
            on:click={() => handleSelectGroup(groupTitle, groupAssets)}
            on:keydown={() => handleSelectGroup(groupTitle, groupAssets)}
          >
            {#if $selectedGroup.has(groupTitle)}
              <CheckCircle size="24" color="#4250af" />
            {:else}
              <CircleOutline size="24" color="#757575" />
            {/if}
          </div>
        {/if}

        <span class="truncate first-letter:capitalize" title={groupTitle}>
          {groupTitle}
        </span>
      </p>

      <!-- Image grid -->
      <div
        class="relative"
        style="height: {geometry[groupIndex].containerHeight}px;width: {geometry[groupIndex].containerWidth}px"
      >
        {#each groupAssets as asset, index (asset.id)}
          {@const box = geometry[groupIndex].boxes[index]}
          <div
            class="absolute"
            style="width: {box.width}px; height: {box.height}px; top: {box.top}px; left: {box.left}px"
          >
            <Thumbnail
              {asset}
              {groupIndex}
              on:click={() => assetClickHandler(asset, groupAssets, groupTitle)}
              on:select={() => assetSelectHandler(asset, groupAssets, groupTitle)}
              on:mouse-event={() => assetMouseEventHandler(groupTitle, asset)}
              selected={$selectedAssets.has(asset) || $assetStore.albumAssets.has(asset.id)}
              selectionCandidate={$assetSelectionCandidates.has(asset)}
              disabled={$assetStore.albumAssets.has(asset.id)}
              thumbnailWidth={box.width}
              thumbnailHeight={box.height}
              {publicSharedKey}
            />
          </div>
        {/each}
      </div>
    </div>
  {/each}
</section>

<style>
  #asset-group-by-date {
    contain: layout;
  }
</style>
