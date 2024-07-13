<script lang="ts">
  import { resizeObserver } from '$lib/actions/resize-observer';
  import Icon from '$lib/components/elements/icon.svelte';
  import type { AssetInteractionStore } from '$lib/stores/asset-interaction.store';
  import { AssetBucket, type AssetStore, type Viewport } from '$lib/stores/assets.store';
  import { navigate } from '$lib/utils/navigation';
  import { type DateGroup } from '$lib/utils/timeline-util';
  import type { AssetResponseDto } from '@immich/sdk';
  import { mdiCheckCircle, mdiCircleOutline } from '@mdi/js';
  import { createEventDispatcher } from 'svelte';
  import { fly } from 'svelte/transition';
  import Thumbnail from '../assets/thumbnail/thumbnail.svelte';
  import { intersectionObserver } from '$lib/actions/intersection-observer';

  export let element: HTMLElement | undefined = undefined;
  export let isSelectionMode = false;
  export let viewport: Viewport;
  export let singleSelect = false;
  export let withStacked = false;
  export let showArchiveIcon = false;
  export let assetGridElement: HTMLElement | undefined = undefined;
  export let renderThumbsAtBottomMargin: string | undefined = undefined;
  export let renderThumbsAtTopMargin: string | undefined = undefined;
  export let assetStore: AssetStore;
  export let bucket: AssetBucket;
  export let assetInteractionStore: AssetInteractionStore;

  export let onScrollTarget: (({ bucket, offset }: { bucket: AssetBucket; offset: number }) => void) | undefined =
    undefined;
  export let onAssetInGrid: ((asset: AssetResponseDto) => void) | undefined = undefined;
  export let onBucketHeight: (bucket: AssetBucket, height: number) => void;

  $: bucketDate = bucket.bucketDate;
  $: dateGroups = bucket.dateGroups;

  /* TODO figure out a way to calculate this*/
  const TITLE_HEIGHT = 51;
  // const ASSET_GRID_PADDING = 60;

  const { selectedGroup, selectedAssets, assetSelectionCandidates, isMultiSelectState } = assetInteractionStore;
  const dispatch = createEventDispatcher<{
    select: { title: string; assets: AssetResponseDto[] };
    selectAssets: AssetResponseDto;
    selectAssetCandidates: AssetResponseDto | null;
    shift: { heightDelta: number };
  }>();

  let isMouseOverGroup = false;
  let hoveredDateGroup = '';

  const onClick = (assets: AssetResponseDto[], groupTitle: string, asset: AssetResponseDto, event: Event) => {
    event.preventDefault();
    if (isSelectionMode || $isMultiSelectState) {
      assetSelectHandler(asset, assets, groupTitle);
      return;
    }
    void navigate({ targetRoute: 'current', assetId: asset.id });
  };

  const findTotalOffset = (element: HTMLElement, stop: HTMLElement) => {
    let offset = 0;
    while (element.offsetParent && element !== stop) {
      offset += element.offsetTop;
      element = element.offsetParent as HTMLElement;
    }
    return offset;
  };

  const onRetrieveElement = (element: HTMLElement) => {
    if (assetGridElement && onScrollTarget) {
      const offset = findTotalOffset(element, assetGridElement) - TITLE_HEIGHT;
      onScrollTarget({ bucket, offset });
    }
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

<section
  id="asset-group-by-date"
  class="flex flex-wrap gap-x-12"
  data-bucket-date={bucketDate}
  use:resizeObserver={({ height }) => onBucketHeight(bucket, height)}
  bind:this={element}
>
  {#each dateGroups as dateGroup, groupIndex (dateGroup.date)}
    {@const display =
      dateGroup.intersecting || !!dateGroup.assets.some((asset) => asset.id === $assetStore.pendingScrollAssetId)}

    <div
      use:intersectionObserver={{
        onIntersect: () => assetStore.updateBucketDateGroup(dateGroup, { intersecting: true }),
        onSeparate: () => assetStore.updateBucketDateGroup(dateGroup, { intersecting: false }),
        top: '0%',
        bottom: '0%',
        root: assetGridElement,
      }}
      data-display={display}
      data-date-group={dateGroup.date}
      style:height={dateGroup.height + 'px'}
      style:width={dateGroup.geometry.containerWidth + 'px'}
      style:overflow={'clip'}
    >
      {#if display}
        <!-- Asset Group By Date -->
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <div
          class="flex flex-col"
          use:resizeObserver={({ height }) => assetStore.updateBucketDateGroup(dateGroup, { height })}
          on:mouseenter={() => {
            isMouseOverGroup = true;
            assetMouseEventHandler(dateGroup.groupTitle, null);
          }}
          on:mouseleave={() => {
            isMouseOverGroup = false;
            assetMouseEventHandler(dateGroup.groupTitle, null);
          }}
        >
          <!-- Date group title -->
          <div
            class="flex z-[100] sticky top-0 pt-7 pb-5 h-6 place-items-center text-xs font-medium text-immich-fg bg-immich-bg dark:bg-immich-dark-bg dark:text-immich-dark-fg md:text-sm"
            style="width: {dateGroup.geometry.containerWidth}px"
          >
            {#if !singleSelect && ((hoveredDateGroup == dateGroup.groupTitle && isMouseOverGroup) || $selectedGroup.has(dateGroup.groupTitle))}
              <div
                transition:fly={{ x: -24, duration: 200, opacity: 0.5 }}
                class="inline-block px-2 hover:cursor-pointer"
                on:click={() => handleSelectGroup(dateGroup.groupTitle, dateGroup.assets)}
                on:keydown={() => handleSelectGroup(dateGroup.groupTitle, dateGroup.assets)}
              >
                {#if $selectedGroup.has(dateGroup.groupTitle)}
                  <Icon path={mdiCheckCircle} size="24" color="#4250af" />
                {:else}
                  <Icon path={mdiCircleOutline} size="24" color="#757575" />
                {/if}
              </div>
            {/if}

            <span class="w-full truncate first-letter:capitalize" title={dateGroup.groupTitle}>
              {dateGroup.groupTitle}
            </span>
          </div>

          <!-- Image grid -->
          <div
            class="relative overflow-clip"
            style={`height: ${dateGroup.geometry.containerHeight}px; width: ${dateGroup.geometry.containerWidth}px`}
          >
            {#each dateGroup.assets as asset, index (asset.id)}
              {@const box = dateGroup.geometry.boxes[index]}
              <!-- update ASSET_GRID_PADDING-->
              <div
                use:intersectionObserver={{
                  onIntersect: () => onAssetInGrid?.(asset),
                  top: `-${TITLE_HEIGHT}px`,
                  bottom: `-${viewport.height - TITLE_HEIGHT - 1}px`,
                  right: `-${viewport.width - 1}px`,
                  root: assetGridElement,
                }}
                class="absolute"
                style="width: {box.width}px; height: {box.height}px; top: {box.top}px; left: {box.left}px"
              >
                <Thumbnail
                  forceDisplay={$assetStore.pendingScrollAssetId === asset.id}
                  intersectionConfig={{
                    root: assetGridElement,
                    bottom: renderThumbsAtBottomMargin,
                    top: renderThumbsAtTopMargin,
                    priority: 1,
                  }}
                  retrieveElement={$assetStore.pendingScrollAssetId === asset.id}
                  {onRetrieveElement}
                  showStackedIcon={withStacked}
                  {showArchiveIcon}
                  {asset}
                  {groupIndex}
                  onClick={(asset, event) => onClick(dateGroup.assets, dateGroup.groupTitle, asset, event)}
                  on:select={() => assetSelectHandler(asset, dateGroup.assets, dateGroup.groupTitle)}
                  on:mouse-event={() => assetMouseEventHandler(dateGroup.groupTitle, asset)}
                  selected={$selectedAssets.has(asset) || $assetStore.albumAssets.has(asset.id)}
                  selectionCandidate={$assetSelectionCandidates.has(asset)}
                  disabled={$assetStore.albumAssets.has(asset.id)}
                  thumbnailWidth={box.width}
                  thumbnailHeight={box.height}
                />
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  {/each}
</section>

<style>
  #asset-group-by-date {
    contain: layout;
  }
</style>
