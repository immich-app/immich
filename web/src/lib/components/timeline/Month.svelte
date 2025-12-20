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
  import { onDestroy, tick, type Snippet } from 'svelte';

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
        eventManager.once('TimelineLoaded', async ({ id }) => {
          animationTargetAssetId = id;
          await tick();
          resolve();
        });
      }),
      [],
      () => {
        animationTargetAssetId = null;
      },
    );
  };
  if (viewTransitionManager.isSupported()) {
    eventManager.on('TransitionToTimeline', transitionToTimelineCallback);
    onDestroy(() => {
      eventManager.off('TransitionToTimeline', transitionToTimelineCallback);
    });
  }
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
    animation-duration: 250ms;
  }

  :global(::view-transition-old(*)),
  :global(::view-transition-new(*)) {
    mix-blend-mode: normal;
    animation-duration: inherit;
  }

  :global(::view-transition-old(*)) {
    animation-name: fadeOut;
    animation-fill-mode: forwards;
  }
  :global(::view-transition-new(*)) {
    animation-name: fadeIn;
    animation-fill-mode: forwards;
  }

  :global(::view-transition-old(root)) {
    animation: 250ms 0s fadeOut forwards;
  }
  :global(::view-transition-new(root)) {
    animation: 250ms 0s fadeIn forwards;
  }
  :global(html:active-view-transition-type(slideshow)) {
    :global(&::view-transition-old(root)) {
      animation: 1s 0s fadeOut forwards;
    }
    :global(&::view-transition-new(root)) {
      animation: 1s 0s fadeIn forwards;
    }
  }
  :global(html:active-view-transition-type(viewer-nav)) {
    :global(&::view-transition-old(root)) {
      animation: 350ms 0s fadeOut forwards;
    }
    :global(&::view-transition-new(root)) {
      animation: 350ms 0s fadeIn forwards;
    }
  }
  :global(::view-transition-old(info)) {
    animation: 250ms 0s flyOutRight forwards;
  }
  :global(::view-transition-new(info)) {
    animation: 250ms 0s flyInRight forwards;
  }

  :global(::view-transition-group(detail-panel)) {
    z-index: 1;
  }
  :global(::view-transition-old(detail-panel)),
  :global(::view-transition-new(detail-panel)) {
    animation: none;
  }
  :global(::view-transition-group(letterbox-left)),
  :global(::view-transition-group(letterbox-right)),
  :global(::view-transition-group(letterbox-top)),
  :global(::view-transition-group(letterbox-bottom)) {
    z-index: 4;
  }

  :global(::view-transition-old(letterbox-left)),
  :global(::view-transition-old(letterbox-right)),
  :global(::view-transition-old(letterbox-top)),
  :global(::view-transition-old(letterbox-bottom)) {
    background-color: black;
  }

  :global(::view-transition-new(letterbox-left)),
  :global(::view-transition-new(letterbox-right)) {
    height: 100dvh;
  }

  :global(::view-transition-new(letterbox-left)),
  :global(::view-transition-new(letterbox-right)),
  :global(::view-transition-new(letterbox-top)),
  :global(::view-transition-new(letterbox-bottom)) {
    background-color: black;
    opacity: 1 !important;
  }

  :global(::view-transition-group(exclude-leftbutton)),
  :global(::view-transition-group(exclude-rightbutton)),
  :global(::view-transition-group(exclude)) {
    animation: none;
    z-index: 5;
  }
  :global(::view-transition-old(exclude-leftbutton)),
  :global(::view-transition-old(exclude-rightbutton)),
  :global(::view-transition-old(exclude)) {
    visibility: hidden;
  }
  :global(::view-transition-new(exclude-leftbutton)),
  :global(::view-transition-new(exclude-rightbutton)),
  :global(::view-transition-new(exclude)) {
    animation: none;
    z-index: 5;
  }

  :global(::view-transition-old(hero)) {
    animation: 350ms fadeOut forwards;
    align-content: center;
  }
  :global(::view-transition-new(hero)) {
    animation: 350ms fadeIn forwards;
    align-content: center;
  }
  :global(::view-transition-old(next)),
  :global(::view-transition-old(next-old)) {
    animation: 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94) flyOutLeft forwards;
    overflow: hidden;
  }

  :global(::view-transition-new(next)),
  :global(::view-transition-new(next-new)) {
    animation: 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94) flyInRight forwards;
    overflow: hidden;
  }

  :global(::view-transition-old(previous)) {
    animation: 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94) flyOutRight forwards;
  }
  :global(::view-transition-old(previous-old)) {
    animation: 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94) flyOutRight forwards;
    overflow: hidden;
    z-index: -1;
  }

  :global(::view-transition-new(previous)) {
    animation: 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94) flyInLeft forwards;
  }

  :global(::view-transition-new(previous-new)) {
    animation: 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94) flyInLeft forwards;
    overflow: hidden;
  }

  @keyframes -global-flyInLeft {
    from {
      /* object-position: -25dvw; */
      transform: translateX(-15%);
      opacity: 0.1;
      filter: blur(4px);
    }
    50% {
      opacity: 0.4;
      filter: blur(2px);
    }
    to {
      opacity: 1;
      filter: blur(0);
    }
  }

  @keyframes -global-flyOutLeft {
    from {
      opacity: 1;
      filter: blur(0);
    }
    50% {
      opacity: 0.4;
      filter: blur(2px);
    }
    to {
      /* object-position: -25dvw; */
      transform: translateX(-15%);
      opacity: 0.1;
      filter: blur(4px);
    }
  }

  @keyframes -global-flyInRight {
    from {
      /* object-position: 25dvw; */
      transform: translateX(15%);
      opacity: 0.1;
      filter: blur(4px);
    }
    50% {
      opacity: 0.4;
      filter: blur(2px);
    }
    to {
      opacity: 1;
      filter: blur(0);
    }
  }

  /* Fly out to right */
  @keyframes -global-flyOutRight {
    from {
      opacity: 1;
      filter: blur(0);
    }
    50% {
      opacity: 0.4;
      filter: blur(2px);
    }
    to {
      /* object-position: 50dvw 0px; */
      transform: translateX(15%);
      opacity: 0.1;
      filter: blur(4px);
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

  @media (prefers-reduced-motion) {
    :global(::view-transition-group(previous)),
    :global(::view-transition-group(next)) {
      width: 100% !important;
      height: 100% !important;
      transform: none !important;
    }

    :global(::view-transition-old(previous)),
    :global(::view-transition-old(next)) {
      animation: 250ms fadeOut forwards;
      transform-origin: center;
      height: 100%;
      width: 100%;
      object-fit: contain;
      overflow: hidden;
    }

    :global(::view-transition-new(previous)),
    :global(::view-transition-new(next)) {
      animation: 250ms fadeIn forwards;
      transform-origin: center;
      height: 100%;
      width: 100%;
      object-fit: contain;
    }
  }
</style>
