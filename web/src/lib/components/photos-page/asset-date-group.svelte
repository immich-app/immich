<script lang="ts">
  import IntersectionObserver from '$lib/components/asset-viewer/intersection-observer.svelte';
  import Icon from '$lib/components/elements/icon.svelte';
  import type { AssetInteractionStore } from '$lib/stores/asset-interaction.store';

  import { AssetBucket, type AssetStore, type Viewport } from '$lib/stores/assets.store';
  import { locale } from '$lib/stores/preferences.store';
  import { getAssetRatio } from '$lib/utils/asset-utils';
  import {
    calculateWidth,
    formatGroupTitle,
    fromLocalDateTime,
    splitBucketIntoDateGroups,
    type LayoutBox,
  } from '$lib/utils/timeline-util';
  import type { AssetResponseDto } from '@immich/sdk';
  import { mdiCheckCircle, mdiCircleOutline } from '@mdi/js';
  import justifiedLayout from 'justified-layout';
  import { createEventDispatcher, tick } from 'svelte';
  import { fly } from 'svelte/transition';
  import Thumbnail from '../assets/thumbnail/thumbnail.svelte';
  import { handlePromiseError } from '$lib/utils';

  import { navigate } from '$lib/utils/navigation';
  import { resizeObserver } from '$lib/actions/resize-observer';

  export let element: HTMLElement | undefined = undefined;
  export let assets: AssetResponseDto[];
  export let bucketDate: string;
  export let bucketHeight: number;
  export let isSelectionMode = false;
  export let viewport: Viewport;
  export let singleSelect = false;
  export let withStacked = false;
  export let showArchiveIcon = false;
  export let assetGridElement: HTMLElement | undefined = undefined;
  export let renderThumbsAtBottomMargin: string | undefined = undefined;
  export let renderThumbsAtTopMargin: string | undefined = undefined;
  export let assetStore: AssetStore;
  export let assetInteractionStore: AssetInteractionStore;
  export let onScrollTarget: (({ target, offset }: { target: AssetBucket; offset: number }) => void) | undefined =
    undefined;
  export let onAssetInGrid: ((asset: AssetResponseDto) => void) | undefined = undefined;
  /* TODO figure out a way to calculate this*/
  const TITLE_HEIGHT = 51;
  const ASSET_GRID_PADDING = 60;
  const LAYOUT_OPTIONS = {
    boxSpacing: 2,
    containerPadding: 0,
    targetRowHeightTolerance: 0.15,
    targetRowHeight: 235,
  };
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
  let assetsGroupByDate: AssetResponseDto[][] = [];

  type GeometryType = ReturnType<typeof justifiedLayout> & {
    boxes: LayoutBox[];
    containerWidth: number;
    assets: AssetResponseDto[];
  };

  let geometry: GeometryType[] = [];

  const scrollToThumbnail = (thumbnailElement: HTMLElement) => {
    const thumbBox = thumbnailElement?.offsetParent as HTMLElement;
    const imageGrid = thumbBox.offsetParent as HTMLElement;
    const section = imageGrid.offsetParent as HTMLElement;

    const offsetFromImageGrid = thumbBox.offsetTop;
    const previousSections = imageGrid.offsetTop;

    const sectionOffset = section.offsetTop;
    const offset = offsetFromImageGrid + previousSections + sectionOffset - TITLE_HEIGHT;

    const bucket = $assetStore.buckets.find((bucket) => bucket.bucketDate === section.dataset.bucketDate);

    onScrollTarget?.({ target: bucket!, offset });
  };

  $: {
    assetsGroupByDate = splitBucketIntoDateGroups(assets, $locale);
    geometry = [];
    for (const group of assetsGroupByDate) {
      const layoutResult = justifiedLayout(
        group.map((g) => getAssetRatio(g)),
        {
          ...LAYOUT_OPTIONS,
          containerWidth: Math.floor(viewport.width),
        },
      );
      const geo = {
        ...layoutResult,
        containerWidth: calculateWidth(layoutResult.boxes),
        assets: group,
      };
      geometry.push(geo);
    }
  }

  $: {
    if (actualBucketHeight && actualBucketHeight !== 0 && actualBucketHeight != bucketHeight) {
      const heightDelta = assetStore.updateBucket(bucketDate, actualBucketHeight);
      if (heightDelta !== 0) {
        handlePromiseError(tick().then(() => scrollTimeline(heightDelta)));
      }
    }
  }

  function scrollTimeline(heightDelta: number) {
    dispatch('shift', {
      heightDelta,
    });
  }

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
  use:resizeObserver={(element) => (actualBucketHeight = element.clientHeight)}
  bind:this={element}
>
  {#each assetsGroupByDate as groupAssets, groupIndex (groupAssets[0].id)}
    {@const asset = groupAssets[0]}
    {@const groupTitle = formatGroupTitle(fromLocalDateTime(asset.localDateTime).startOf('day'))}
    <!-- Asset Group By Date -->

    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div
      class="flex flex-col"
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
      <div
        class="flex z-[100] sticky top-0 pt-7 pb-5 h-6 place-items-center text-xs font-medium text-immich-fg bg-immich-bg dark:bg-immich-dark-bg dark:text-immich-dark-fg md:text-sm"
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
              <Icon path={mdiCheckCircle} size="24" color="#4250af" />
            {:else}
              <Icon path={mdiCircleOutline} size="24" color="#757575" />
            {/if}
          </div>
        {/if}

        <span class="w-full truncate first-letter:capitalize" title={groupTitle}>
          {groupTitle}
        </span>
      </div>

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
            <IntersectionObserver
              root={assetGridElement}
              top={`-${TITLE_HEIGHT}px`}
              bottom={`-${viewport.height - TITLE_HEIGHT - ASSET_GRID_PADDING - 1}px`}
              right={`-${viewport.width - 1}px`}
              once={false}
              on:intersected={() => onAssetInGrid?.(asset)}
            >
              <Thumbnail
                root={assetGridElement}
                bottom={renderThumbsAtBottomMargin}
                top={renderThumbsAtTopMargin}
                {assetStore}
                showStackedIcon={withStacked}
                {showArchiveIcon}
                {asset}
                {groupIndex}
                onScrollTarget={scrollToThumbnail}
                onClick={(asset, event) => {
                  event.preventDefault();
                  if (isSelectionMode || $isMultiSelectState) {
                    assetSelectHandler(asset, groupAssets, groupTitle);
                    return;
                  }
                  void navigate({ targetRoute: 'current', assetId: asset.id });
                }}
                on:select={() => assetSelectHandler(asset, groupAssets, groupTitle)}
                on:mouse-event={() => assetMouseEventHandler(groupTitle, asset)}
                selected={$selectedAssets.has(asset) || $assetStore.albumAssets.has(asset.id)}
                selectionCandidate={$assetSelectionCandidates.has(asset)}
                disabled={$assetStore.albumAssets.has(asset.id)}
                thumbnailWidth={box.width}
                thumbnailHeight={box.height}
              />
            </IntersectionObserver>
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
