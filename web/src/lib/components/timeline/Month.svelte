<script lang="ts">
  import AssetLayout from '$lib/components/timeline/AssetLayout.svelte';
  import { eventManager } from '$lib/managers/event-manager.svelte';
  import { DayGroup } from '$lib/managers/timeline-manager/day-group.svelte';
  import type { MonthGroup } from '$lib/managers/timeline-manager/month-group.svelte';
  import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
  import { assetsSnapshot } from '$lib/managers/timeline-manager/utils.svelte';
  import { viewTransitionManager } from '$lib/managers/ViewTransitionManager.svelte';
  import type { VirtualScrollManager } from '$lib/managers/VirtualScrollManager/VirtualScrollManager.svelte';
  import type { AssetInteraction } from '$lib/stores/asset-interaction.svelte';
  import { uploadAssetsStore } from '$lib/stores/upload';
  import type { CommonPosition } from '$lib/utils/layout-utils';
  import { fromTimelinePlainDate, getDateLocaleString } from '$lib/utils/timeline-util';
  import { Icon } from '@immich/ui';
  import { mdiCheckCircle, mdiCircleOutline } from '@mdi/js';
  import { onDestroy, type Snippet } from 'svelte';

  type Props = {
    toAssetViewerTransitionId?: string | null;
    thumbnail: Snippet<[{ asset: TimelineAsset; position: CommonPosition; dayGroup: DayGroup; groupIndex: number }]>;
    customThumbnailLayout?: Snippet<[TimelineAsset]>;
    singleSelect: boolean;
    assetInteraction: AssetInteraction;
    monthGroup: MonthGroup;
    manager: VirtualScrollManager;
    onDayGroupSelect: (dayGroup: DayGroup, assets: TimelineAsset[]) => void;
  };
  let {
    toAssetViewerTransitionId,
    thumbnail: thumbnailWithGroup,
    customThumbnailLayout,
    singleSelect,
    assetInteraction,
    monthGroup,
    manager,
    onDayGroupSelect,
  }: Props = $props();

  let { isUploading } = uploadAssetsStore;
  let hoveredDayGroup = $state<string | null>(null);

  const isMouseOverGroup = $derived(hoveredDayGroup !== null);
  const transitionDuration = $derived(monthGroup.timelineManager.suspendTransitions && !$isUploading ? 0 : 150);

  const filterIntersecting = <T extends { intersecting: boolean }>(intersectables: T[]) => {
    return intersectables.filter(({ intersecting }) => intersecting);
  };

  const getDayGroupFullDate = (dayGroup: DayGroup): string => {
    const { month, year } = dayGroup.monthGroup.yearMonth;
    const date = fromTimelinePlainDate({
      year,
      month,
      day: dayGroup.day,
    });
    return getDateLocaleString(date);
  };

  let toTimelineTransitionAssetId = $state<string | null>(null);
  let animationTargetAssetId = $derived(toTimelineTransitionAssetId ?? toAssetViewerTransitionId ?? null);

  const transitionToTimelineCallback = ({ id }: { id: string }) => {
    const asset = monthGroup.findAssetById({ id });
    if (!asset) {
      return;
    }

    viewTransitionManager.startTransition(
      new Promise<void>((resolve) => {
        eventManager.once('TimelineLoaded', ({ id }) => {
          animationTargetAssetId = id;
          resolve();
        });
      }),
      () => {
        animationTargetAssetId = null;
      },
    );
  };
  eventManager.on('TransitionToTimeline', transitionToTimelineCallback);
  onDestroy(() => {
    eventManager.off('TransitionToTimeline', transitionToTimelineCallback);
  });
</script>

{#each filterIntersecting(monthGroup.dayGroups) as dayGroup, groupIndex (dayGroup.day)}
  {@const absoluteWidth = dayGroup.left}
  {@const isDayGroupSelected = assetInteraction.selectedGroup.has(dayGroup.groupTitle)}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <section
    class={[
      { 'transition-all': !monthGroup.timelineManager.suspendTransitions },
      !monthGroup.timelineManager.suspendTransitions && `delay-${transitionDuration}`,
    ]}
    data-group
    style:position="absolute"
    style:transform={`translate3d(${absoluteWidth}px,${dayGroup.top}px,0)`}
    onmouseenter={() => (hoveredDayGroup = dayGroup.groupTitle)}
    onmouseleave={() => (hoveredDayGroup = null)}
  >
    <!-- Month title -->
    <div
      class="flex pt-7 pb-5 max-md:pt-5 max-md:pb-3 h-6 place-items-center text-xs font-medium text-immich-fg dark:text-immich-dark-fg md:text-sm"
      style:width={dayGroup.width + 'px'}
    >
      {#if !singleSelect}
        <div
          class="hover:cursor-pointer transition-all duration-200 ease-out overflow-hidden w-0"
          class:w-8={(hoveredDayGroup === dayGroup.groupTitle && isMouseOverGroup) ||
            assetInteraction.selectedGroup.has(dayGroup.groupTitle)}
          onclick={() => onDayGroupSelect(dayGroup, assetsSnapshot(dayGroup.getAssets()))}
          onkeydown={() => onDayGroupSelect(dayGroup, assetsSnapshot(dayGroup.getAssets()))}
        >
          {#if isDayGroupSelected}
            <Icon icon={mdiCheckCircle} size="24" class="text-primary" />
          {:else}
            <Icon icon={mdiCircleOutline} size="24" color="#757575" />
          {/if}
        </div>
      {/if}

      <span class="w-full truncate first-letter:capitalize" title={getDayGroupFullDate(dayGroup)}>
        {dayGroup.groupTitle}
      </span>
    </div>

    <AssetLayout
      {animationTargetAssetId}
      {manager}
      viewerAssets={dayGroup.viewerAssets}
      height={dayGroup.height}
      width={dayGroup.width}
      {customThumbnailLayout}
    >
      {#snippet thumbnail({ asset, position })}
        {@render thumbnailWithGroup({ asset, position, dayGroup, groupIndex })}
      {/snippet}
    </AssetLayout>
  </section>
{/each}

<style>
  section {
    contain: layout paint style;
  }

  :global(::view-transition) {
    background: black;
  }

  :global(::view-transition-group(*)) {
    animation-duration: 260ms;
  }

  :global(::view-transition-old(*)),
  :global(::view-transition-new(*)) {
    mix-blend-mode: normal;
    animation-timing-function: cubic-bezier(0.33, 1, 0.68, 1);
    animation-duration: inherit;
  }

  :global(::view-transition-old(*)) {
    animation-name: fadeOut;
  }
  :global(::view-transition-new(*)) {
    animation-name: fadeIn;
  }

  :global(::view-transition-old(root)) {
    animation: 250ms 0s fadeOut forwards;
    animation-timing-function: inherit;
  }
  :global(::view-transition-new(root)) {
    animation: 250ms 0s fadeIn forwards;
    animation-timing-function: inherit;
  }

  :global(::view-transition-old(info)) {
    animation: 250ms 0s flyOutRight forwards;
    animation-timing-function: inherit;
  }
  :global(::view-transition-new(info)) {
    animation: 250ms 0s flyInRight forwards;
    animation-timing-function: inherit;
  }

  :global(::view-transition-old(onTop)),
  :global(::view-transition-new(onTop)) {
    z-index: 1000000;
    animation: none;
  }

  :global(::view-transition-old(hero)) {
    animation: 350ms fadeIn;
    display: flex;
    align-content: center;
  }
  :global(::view-transition-new(hero)) {
    animation: 350ms fadeIn;
    display: flex;
    align-content: center;
  }

  :global(::view-transition-new(exclude)) {
    animation: none;
  }

  :global(::view-transition-old(next)) {
    animation: 350ms flyOutLeft;
    transform-origin: center;
    height: 100%;
    object-fit: contain;
  }
  :global(::view-transition-new(next)) {
    animation: 350ms flyInRight;
    transform-origin: center;
    height: 100%;
    object-fit: contain;
  }

  :global(::view-transition-old(previous)) {
    animation: 350ms flyOutRight;
    transform-origin: center;
    height: 100%;
    object-fit: contain;
  }
  :global(::view-transition-new(previous)) {
    animation: 350ms flyInLeft;
    transform-origin: center;
    height: 100%;
    object-fit: contain;
  }
  :global(::view-transition-new(navbar)) {
    z-index: 100;
    animation: none;
  }
  @keyframes -global-flyInLeft {
    from {
      transform: translateX(-100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes -global-flyOutLeft {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(-100%);
      opacity: 0;
    }
  }

  @keyframes -global-flyInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  /* Fly out to right */
  @keyframes -global-flyOutRight {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }

  @keyframes -global-fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  @keyframes -global-fadeOut {
    from {
      opacity: 1;
    }
    to {
      opacity: 0;
    }
  }
</style>
