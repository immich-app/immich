<script lang="ts">
  import AssetLayout from '$lib/components/timeline/AssetLayout.svelte';
  import { eventManager } from '$lib/managers/event-manager.svelte';
  import { DayGroup } from '$lib/managers/timeline-manager/day-group.svelte';
  import type { MonthGroup } from '$lib/managers/timeline-manager/month-group.svelte';
  import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
  import { assetsSnapshot } from '$lib/managers/timeline-manager/utils.svelte';
  import { viewTransitionManager } from '$lib/managers/ViewTransitionManager.svelte';
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
    onDayGroupSelect: (dayGroup: DayGroup, assets: TimelineAsset[]) => void;
  };

  let {
    toAssetViewerTransitionId,
    thumbnail: thumbnailWithGroup,
    customThumbnailLayout,
    singleSelect,
    assetInteraction,
    monthGroup,
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
          void tick().then(resolve);
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
</style>
