<script lang="ts">
  import { assetViewingStore } from '$lib/stores/asset-viewing.store';
  import { locale } from '$lib/stores/preferences.store';
  import { formatGroupTitle, splitBucketIntoDateGroups } from '$lib/utils/timeline-util';
  import type { AssetResponseDto } from '@api';
  import { DateTime } from 'luxon';
  import { onDestroy, onMount } from 'svelte';
  import AssetViewer from '../asset-viewer/asset-viewer.svelte';
  import IntersectionObserver from '../asset-viewer/intersection-observer.svelte';
  import Portal from '../shared-components/portal/portal.svelte';
  import Scrollbar, {
    OnScrollbarClickDetail,
    OnScrollbarDragDetail,
  } from '../shared-components/scrollbar/scrollbar.svelte';
  import AssetDateGroup from './asset-date-group.svelte';
  import MemoryLane from './memory-lane.svelte';

  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { AppRoute } from '$lib/constants';
  import type { AssetInteractionStore } from '$lib/stores/asset-interaction.store';
  import { BucketPosition, type AssetStore, type Viewport } from '$lib/stores/assets.store';
  import { isSearchEnabled } from '$lib/stores/search.store';
  import ShowShortcuts from '../shared-components/show-shortcuts.svelte';

  export let isAlbumSelectionMode = false;
  export let showMemoryLane = false;

  export let assetStore: AssetStore;
  export let assetInteractionStore: AssetInteractionStore;

  const { assetSelectionCandidates, assetSelectionStart, selectedAssets, isMultiSelectState } = assetInteractionStore;

  let { isViewing: showAssetViewer, asset: viewingAsset } = assetViewingStore;

  const viewport: Viewport = { width: 0, height: 0 };
  let assetGridElement: HTMLElement;
  let showShortcuts = false;

  const onKeyboardPress = (event: KeyboardEvent) => handleKeyboardPress(event);

  onMount(async () => {
    document.addEventListener('keydown', onKeyboardPress);
    await assetStore.init(viewport);
  });

  onDestroy(() => {
    if (browser) {
      document.removeEventListener('keydown', onKeyboardPress);
    }
  });

  const handleKeyboardPress = (event: KeyboardEvent) => {
    if ($isSearchEnabled) {
      return;
    }

    if (!$showAssetViewer) {
      switch (event.key) {
        case 'Escape':
          assetInteractionStore.clearMultiselect();
          return;
        case '?':
          if (event.shiftKey) {
            event.preventDefault();
            showShortcuts = !showShortcuts;
          }
          return;
        case '/':
          event.preventDefault();
          goto(AppRoute.EXPLORE);
          return;
      }
    }
  };

  function intersectedHandler(event: CustomEvent) {
    const el = event.detail.container as HTMLElement;
    const target = el.firstChild as HTMLElement;
    if (target) {
      const bucketDate = target.id.split('_')[1];
      assetStore.loadBucket(bucketDate, event.detail.position);
    }
  }

  function handleScrollTimeline(event: CustomEvent) {
    assetGridElement.scrollBy(0, event.detail.heightDelta);
  }

  const navigateToPreviousAsset = async () => {
    const prevAsset = await assetStore.getPreviousAssetId($viewingAsset.id);
    if (prevAsset) {
      assetViewingStore.setAssetId(prevAsset);
    }
  };

  const navigateToNextAsset = async () => {
    const nextAsset = await assetStore.getNextAssetId($viewingAsset.id);
    if (nextAsset) {
      assetViewingStore.setAssetId(nextAsset);
    }
  };

  let lastScrollPosition = 0;
  let animationTick = false;

  const handleTimelineScroll = () => {
    if (!animationTick) {
      window.requestAnimationFrame(() => {
        lastScrollPosition = assetGridElement?.scrollTop;
        animationTick = false;
      });

      animationTick = true;
    }
  };

  const handleScrollbarClick = (e: OnScrollbarClickDetail) => {
    assetGridElement.scrollTop = e.scrollTo;
  };

  const handleScrollbarDrag = (e: OnScrollbarDragDetail) => {
    assetGridElement.scrollTop = e.scrollTo;
  };

  const handleArchiveSuccess = (e: CustomEvent) => {
    const asset = e.detail as AssetResponseDto;
    navigateToNextAsset();
    assetStore.removeAsset(asset.id);
  };

  let lastAssetMouseEvent: AssetResponseDto | null = null;

  $: if (!lastAssetMouseEvent) {
    assetInteractionStore.clearAssetSelectionCandidates();
  }

  let shiftKeyIsDown = false;

  const onKeyDown = (e: KeyboardEvent) => {
    if ($isSearchEnabled) {
      return;
    }

    if (e.key == 'Shift') {
      e.preventDefault();
      shiftKeyIsDown = true;
    }
  };

  const onKeyUp = (e: KeyboardEvent) => {
    if ($isSearchEnabled) {
      return;
    }

    if (e.key == 'Shift') {
      e.preventDefault();
      shiftKeyIsDown = false;
    }
  };

  $: if (!shiftKeyIsDown) {
    assetInteractionStore.clearAssetSelectionCandidates();
  }

  $: if (shiftKeyIsDown && lastAssetMouseEvent) {
    selectAssetCandidates(lastAssetMouseEvent);
  }

  const handleSelectAssetCandidates = (e: CustomEvent) => {
    const asset = e.detail.asset;
    if (asset) {
      selectAssetCandidates(asset);
    }
    lastAssetMouseEvent = asset;
  };

  const handleSelectAssets = async (e: CustomEvent) => {
    const asset = e.detail.asset;
    if (!asset) {
      return;
    }

    const rangeSelection = $assetSelectionCandidates.size > 0;
    const deselect = $selectedAssets.has(asset);

    // Select/deselect already loaded assets
    if (deselect) {
      for (const candidate of $assetSelectionCandidates || []) {
        assetInteractionStore.removeAssetFromMultiselectGroup(candidate);
      }
      assetInteractionStore.removeAssetFromMultiselectGroup(asset);
    } else {
      for (const candidate of $assetSelectionCandidates || []) {
        assetInteractionStore.addAssetToMultiselectGroup(candidate);
      }
      assetInteractionStore.addAssetToMultiselectGroup(asset);
    }

    assetInteractionStore.clearAssetSelectionCandidates();

    if ($assetSelectionStart && rangeSelection) {
      let startBucketIndex = $assetStore.getBucketIndexByAssetId($assetSelectionStart.id);
      let endBucketIndex = $assetStore.getBucketIndexByAssetId(asset.id);

      if (startBucketIndex === null || endBucketIndex === null) {
        return;
      }

      if (endBucketIndex < startBucketIndex) {
        [startBucketIndex, endBucketIndex] = [endBucketIndex, startBucketIndex];
      }

      // Select/deselect assets in all intermediate buckets
      for (let bucketIndex = startBucketIndex + 1; bucketIndex < endBucketIndex; bucketIndex++) {
        const bucket = $assetStore.buckets[bucketIndex];
        await assetStore.loadBucket(bucket.bucketDate, BucketPosition.Unknown);
        for (const asset of bucket.assets) {
          if (deselect) {
            assetInteractionStore.removeAssetFromMultiselectGroup(asset);
          } else {
            assetInteractionStore.addAssetToMultiselectGroup(asset);
          }
        }
      }

      // Update date group selection
      for (let bucketIndex = startBucketIndex; bucketIndex <= endBucketIndex; bucketIndex++) {
        const bucket = $assetStore.buckets[bucketIndex];

        // Split bucket into date groups and check each group
        const assetsGroupByDate = splitBucketIntoDateGroups(bucket.assets, $locale);

        for (const dateGroup of assetsGroupByDate) {
          const dateGroupTitle = formatGroupTitle(DateTime.fromISO(dateGroup[0].fileCreatedAt).startOf('day'));
          if (dateGroup.every((a) => $selectedAssets.has(a))) {
            assetInteractionStore.addGroupToMultiselectGroup(dateGroupTitle);
          } else {
            assetInteractionStore.removeGroupFromMultiselectGroup(dateGroupTitle);
          }
        }
      }
    }

    assetInteractionStore.setAssetSelectionStart(deselect ? null : asset);
  };

  const selectAssetCandidates = (asset: AssetResponseDto) => {
    if (!shiftKeyIsDown) {
      return;
    }

    const rangeStart = $assetSelectionStart;
    if (!rangeStart) {
      return;
    }

    let start = $assetStore.assets.indexOf(rangeStart);
    let end = $assetStore.assets.indexOf(asset);

    if (start > end) {
      [start, end] = [end, start];
    }

    assetInteractionStore.setAssetSelectionCandidates($assetStore.assets.slice(start, end + 1));
  };

  const onSelectStart = (e: Event) => {
    if ($isMultiSelectState && shiftKeyIsDown) {
      e.preventDefault();
    }
  };
</script>

<svelte:window on:keydown={onKeyDown} on:keyup={onKeyUp} on:selectstart={onSelectStart} />

{#if showShortcuts}
  <ShowShortcuts on:close={() => (showShortcuts = !showShortcuts)} />
{/if}

{#if $assetStore.timelineHeight > viewport.height}
  <Scrollbar
    {assetStore}
    scrollbarHeight={viewport.height}
    scrollTop={lastScrollPosition}
    on:onscrollbarclick={(e) => handleScrollbarClick(e.detail)}
    on:onscrollbardrag={(e) => handleScrollbarDrag(e.detail)}
  />
{/if}

<!-- Right margin MUST be equal to the width of immich-scrubbable-scrollbar -->
<section
  id="asset-grid"
  class="scrollbar-hidden mb-4 ml-4 mr-[60px] overflow-y-auto"
  bind:clientHeight={viewport.height}
  bind:clientWidth={viewport.width}
  bind:this={assetGridElement}
  on:scroll={handleTimelineScroll}
>
  {#if assetGridElement}
    {#if showMemoryLane}
      <MemoryLane />
    {/if}
    <section id="virtual-timeline" style:height={$assetStore.timelineHeight + 'px'}>
      {#each $assetStore.buckets as bucket, bucketIndex (bucketIndex)}
        <IntersectionObserver
          on:intersected={intersectedHandler}
          on:hidden={() => assetStore.cancelBucket(bucket)}
          let:intersecting
          top={750}
          bottom={750}
          root={assetGridElement}
        >
          <div id={'bucket_' + bucket.bucketDate} style:height={bucket.bucketHeight + 'px'}>
            {#if intersecting}
              <AssetDateGroup
                {assetStore}
                {assetInteractionStore}
                {isAlbumSelectionMode}
                on:shift={handleScrollTimeline}
                on:selectAssetCandidates={handleSelectAssetCandidates}
                on:selectAssets={handleSelectAssets}
                assets={bucket.assets}
                bucketDate={bucket.bucketDate}
                bucketHeight={bucket.bucketHeight}
                {viewport}
              />
            {/if}
          </div>
        </IntersectionObserver>
      {/each}
    </section>
  {/if}
</section>

<Portal target="body">
  {#if $showAssetViewer}
    <AssetViewer
      {assetStore}
      asset={$viewingAsset}
      on:navigate-previous={navigateToPreviousAsset}
      on:navigate-next={navigateToNextAsset}
      on:close={() => {
        assetViewingStore.showAssetViewer(false);
      }}
      on:archived={handleArchiveSuccess}
    />
  {/if}
</Portal>

<style>
  #asset-grid {
    contain: layout;
    scrollbar-width: none;
  }
</style>
