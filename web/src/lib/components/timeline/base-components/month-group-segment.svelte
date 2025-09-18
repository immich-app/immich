<script lang="ts">
  import Skeleton from '$lib/elements/Skeleton.svelte';
  import type { DayGroup } from '$lib/managers/timeline-manager/day-group.svelte';
  import type { MonthGroup } from '$lib/managers/timeline-manager/month-group.svelte';
  import type { TimelineManager } from '$lib/managers/timeline-manager/timeline-manager.svelte';
  import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
  import type { AssetInteraction } from '$lib/stores/asset-interaction.svelte';
  import { type Snippet } from 'svelte';

  interface Props {
    segment: MonthGroup;
    timelineManager: TimelineManager;
    customThumbnailLayout?: Snippet<[TimelineAsset]>;
    isSelectionMode?: boolean;
    singleSelect?: boolean;
    assetInteraction: AssetInteraction;
    withStacked?: boolean;
    showArchiveIcon?: boolean;
    scrollToFunction: (top: number) => void;
    onAssetOpen?: (dayGroup: DayGroup, asset: TimelineAsset, defaultAssetOpen: () => void) => void;
    onSelect?: (asset: TimelineAsset) => void;
    onTriggeredScrollCompensation: (compensation: { heightDelta?: number; scrollTop?: number }) => void;
  }

  let {
    segment: monthGroup,
    timelineManager,
    customThumbnailLayout,
    isSelectionMode = false,
    singleSelect = false,
    assetInteraction,
    withStacked = false,
    showArchiveIcon = false,
    scrollToFunction,
    onAssetOpen,
    onSelect,
    onTriggeredScrollCompensation,
  }: Props = $props();

  const shouldDisplay = $derived(monthGroup.intersecting);
  const absoluteHeight = $derived(monthGroup.top);
</script>

<p id="a">a</p>
{#if !shouldDisplay}
  <div
    style:height={monthGroup.height + 'px'}
    style:position="absolute"
    style:transform={`translate3d(0,${monthGroup.top}px,0)`}
    style:width="100%"
  >
    <Skeleton height={monthGroup.height - monthGroup.timelineManager.headerHeight} title={monthGroup.monthGroupTitle} />
  </div>
{:else}
  <div
    class="month-group"
    style:height={monthGroup.height + 'px'}
    style:position="absolute"
    style:transform={`translate3d(0,${monthGroup.top}px,0)`}
    style:width="100%"
  >
    {@render contents()}
  </div>
{/if}

<style>
  .month-group {
    contain: layout size paint;
    transform-style: flat;
    backface-visibility: hidden;
    transform-origin: center center;
  }
</style>
