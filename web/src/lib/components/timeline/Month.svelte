<script lang="ts">
  import { focusAsset } from '$lib/components/timeline/actions/focus-actions';
  import AssetLayout from '$lib/components/timeline/AssetLayout.svelte';
  import { assetViewerManager } from '$lib/managers/asset-viewer-manager.svelte';
  import type { AssetMultiSelectManager } from '$lib/managers/asset-multi-select-manager.svelte';
  import { eventManager } from '$lib/managers/event-manager.svelte';
  import { TimelineDay } from '$lib/managers/timeline-manager/timeline-day.svelte';
  import type { TimelineMonth } from '$lib/managers/timeline-manager/timeline-month.svelte';
  import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
  import { assetsSnapshot, filterIsInOrNearViewport } from '$lib/managers/timeline-manager/utils.svelte';
  import { viewTransitionManager } from '$lib/managers/ViewTransitionManager.svelte';
  import { uploadAssetsStore } from '$lib/stores/upload';
  import type { CommonPosition } from '$lib/utils/layout-utils';
  import { fromTimelinePlainDate, getDateLocaleString } from '$lib/utils/timeline-util';
  import { Icon } from '@immich/ui';
  import { mdiCheckCircle, mdiCircleOutline } from '@mdi/js';
  import { onMount, tick, type Snippet } from 'svelte';

  type Props = {
    toViewerHeroAssetId?: string | null;
    thumbnail: Snippet<
      [
        {
          asset: TimelineAsset;
          position: CommonPosition;
          timelineDay: TimelineDay;
          groupIndex: number;
        },
      ]
    >;
    customThumbnailLayout?: Snippet<[TimelineAsset]>;
    singleSelect: boolean;
    assetInteraction: AssetMultiSelectManager;
    timelineMonth: TimelineMonth;
    onTimelineDaySelect: (timelineDay: TimelineDay, assets: TimelineAsset[]) => void;
  };

  let {
    toViewerHeroAssetId,
    thumbnail: thumbnailWithGroup,
    customThumbnailLayout,
    singleSelect,
    assetInteraction,
    timelineMonth,
    onTimelineDaySelect,
  }: Props = $props();

  let { isUploading } = uploadAssetsStore;
  let hoveredTimelineDay = $state<string | null>(null);

  const transitionDuration = $derived(timelineMonth.timelineManager.suspendTransitions && !$isUploading ? 0 : 150);

  const getTimelineDayFullDate = (timelineDay: TimelineDay): string => {
    const { month, year } = timelineDay.timelineMonth.yearMonth;
    const date = fromTimelinePlainDate({
      year,
      month,
      day: timelineDay.day,
    });
    return getDateLocaleString(date);
  };

  let toTimelineHeroAssetId = $state<string | null>(null);
  let heroTransitionAssetId = $derived(toTimelineHeroAssetId ?? toViewerHeroAssetId ?? null);

  const handleViewerCloseTransition = ({ id }: { id: string }) => {
    const asset = timelineMonth.findAssetById({ id });
    if (!asset) {
      return;
    }
    void viewTransitionManager.startTransition({
      types: ['timeline'],
      performUpdate: async () => {
        assetViewerManager.emit('ViewerCloseTransitionReady');
        const event = await eventManager.untilNext('TimelineLoaded');
        toTimelineHeroAssetId = event.id;
        await tick();
      },
      onFinished: () => {
        toTimelineHeroAssetId = null;
        focusAsset(asset.id);
      },
    });
  };
  if (viewTransitionManager.isSupported()) {
    onMount(() => assetViewerManager.on({ ViewerCloseTransition: handleViewerCloseTransition }));
  }
</script>

{#each filterIsInOrNearViewport(timelineMonth.timelineDays) as timelineDay, groupIndex (timelineDay.day)}
  {@const isTimelineDaySelected = assetInteraction.selectedGroup.has(timelineDay.groupTitle)}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <section
    class={[
      { 'transition-all': !timelineMonth.timelineManager.suspendTransitions },
      !timelineMonth.timelineManager.suspendTransitions && `delay-${transitionDuration}`,
    ]}
    data-group
    style:position="absolute"
    style:inset-inline-start={timelineDay.start + 'px'}
    style:top={timelineDay.top + 'px'}
    onmouseenter={() => (hoveredTimelineDay = timelineDay.groupTitle)}
    onmouseleave={() => (hoveredTimelineDay = null)}
  >
    <!-- Day title -->
    <div
      class="flex pt-7 pb-5 max-md:pt-5 max-md:pb-3 h-6 place-items-center text-xs font-medium text-immich-fg dark:text-immich-dark-fg md:text-sm"
      style:width={timelineDay.width + 'px'}
    >
      {#if !singleSelect}
        <div
          class="hover:cursor-pointer transition-all duration-200 ease-out overflow-hidden w-0"
          class:w-8={hoveredTimelineDay === timelineDay.groupTitle ||
            assetInteraction.selectedGroup.has(timelineDay.groupTitle)}
          onclick={() => onTimelineDaySelect(timelineDay, assetsSnapshot(timelineDay.getAssets()))}
          onkeydown={() => onTimelineDaySelect(timelineDay, assetsSnapshot(timelineDay.getAssets()))}
        >
          {#if isTimelineDaySelected}
            <Icon icon={mdiCheckCircle} size="24" class="text-primary" />
          {:else}
            <Icon icon={mdiCircleOutline} size="24" class="text-light-500" />
          {/if}
        </div>
      {/if}

      <span class="w-full truncate first-letter:capitalize" title={getTimelineDayFullDate(timelineDay)}>
        {timelineDay.groupTitle}
      </span>
    </div>

    <AssetLayout
      {heroTransitionAssetId}
      suspendTransitions={timelineMonth.timelineManager.suspendTransitions}
      viewerAssets={timelineDay.viewerAssets}
      height={timelineDay.height}
      width={timelineDay.width}
      {customThumbnailLayout}
    >
      {#snippet thumbnail({ asset, position })}
        {@render thumbnailWithGroup({ asset, position, timelineDay, groupIndex })}
      {/snippet}
    </AssetLayout>
  </section>
{/each}

<style>
  section {
    contain: layout paint style;
  }
</style>
