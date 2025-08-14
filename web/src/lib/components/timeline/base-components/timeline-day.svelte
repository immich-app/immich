<script lang="ts">
  import Thumbnail from '$lib/components/assets/thumbnail/thumbnail.svelte';
  import Icon from '$lib/components/elements/icon.svelte';
  import type { MonthGroup } from '$lib/managers/timeline-manager/month-group.svelte';
  import type { TimelineManager } from '$lib/managers/timeline-manager/timeline-manager.svelte';
  import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
  import { assetSnapshot, assetsSnapshot } from '$lib/managers/timeline-manager/utils.svelte';
  import { uploadAssetsStore } from '$lib/stores/upload';

  import { mdiCheckCircle, mdiCircleOutline } from '@mdi/js';

  import { flip } from 'svelte/animate';
  import { fly, scale } from 'svelte/transition';

  import { DayGroup } from '$lib/managers/timeline-manager/day-group.svelte';

  let { isUploading } = uploadAssetsStore;

  interface Props {
    isSelectionMode: boolean;
    singleSelect: boolean;
    withStacked: boolean;
    showArchiveIcon: boolean;
    monthGroup: MonthGroup;
    timelineManager: TimelineManager;

    onScrollCompensation: (compensation: { heightDelta?: number; scrollTop?: number }) => void;

    onHover: (dayGroup: DayGroup, asset: TimelineAsset) => void;
    onAssetOpen: (dayGroup: DayGroup, asset: TimelineAsset) => void;
    onAssetSelect: (dayGroup: DayGroup, asset: TimelineAsset) => void;
    onDayGroupSelect: (dayGroup: DayGroup, assets: TimelineAsset[]) => void;

    // these should be replaced with reactive properties in timelinemanager
    isDayGroupSelected: (dayGroup: DayGroup) => boolean;
    isAssetSelected: (asset: TimelineAsset) => boolean;
    isAssetSelectionCandidate: (asset: TimelineAsset) => boolean;
    isAssetDisabled: (asset: TimelineAsset) => boolean;
  }

  let {
    singleSelect,
    withStacked,
    showArchiveIcon,
    monthGroup,
    timelineManager,
    onScrollCompensation,

    onHover,
    onAssetOpen,
    onAssetSelect,
    onDayGroupSelect,

    isDayGroupSelected,
    isAssetSelected,
    isAssetSelectionCandidate,
    isAssetDisabled,
  }: Props = $props();

  let isMouseOverGroup = $state(false);
  let hoveredDayGroup = $state();

  const transitionDuration = $derived.by(() =>
    monthGroup.timelineManager.suspendTransitions && !$isUploading ? 0 : 150,
  );
  const scaleDuration = $derived(transitionDuration === 0 ? 0 : transitionDuration + 100);

  function filterIntersecting<R extends { intersecting: boolean }>(intersectables: R[]) {
    return intersectables.filter((intersectable) => intersectable.intersecting);
  }

  $effect.root(() => {
    if (timelineManager.scrollCompensation.monthGroup === monthGroup) {
      onScrollCompensation(timelineManager.scrollCompensation);
      timelineManager.clearScrollCompensation();
    }
  });
</script>

{#each filterIntersecting(monthGroup.dayGroups) as dayGroup, groupIndex (dayGroup.day)}
  {@const absoluteWidth = dayGroup.left}

  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <section
    class={[
      { 'transition-all': !monthGroup.timelineManager.suspendTransitions },
      !monthGroup.timelineManager.suspendTransitions && `delay-${transitionDuration}`,
    ]}
    data-group
    style:position="absolute"
    style:transform={`translate3d(${absoluteWidth}px,${dayGroup.top}px,0)`}
    onmouseenter={() => {
      isMouseOverGroup = true;
      hoveredDayGroup = dayGroup.groupTitle;
    }}
    onmouseleave={() => {
      isMouseOverGroup = false;
      hoveredDayGroup = null;
    }}
  >
    <!-- Date group title -->
    <div
      class="flex pt-7 pb-5 max-md:pt-5 max-md:pb-3 h-6 place-items-center text-xs font-medium text-immich-fg dark:text-immich-dark-fg md:text-sm"
      style:width={dayGroup.width + 'px'}
    >
      {#if !singleSelect && ((hoveredDayGroup === dayGroup.groupTitle && isMouseOverGroup) || isDayGroupSelected(dayGroup))}
        <div
          transition:fly={{ x: -24, duration: 200, opacity: 0.5 }}
          class="inline-block pe-2 hover:cursor-pointer"
          onclick={() => onDayGroupSelect(dayGroup, assetsSnapshot(dayGroup.getAssets()))}
          onkeydown={() => onDayGroupSelect(dayGroup, assetsSnapshot(dayGroup.getAssets()))}
        >
          {#if isDayGroupSelected(dayGroup)}
            <Icon path={mdiCheckCircle} size="24" class="text-primary" />
          {:else}
            <Icon path={mdiCircleOutline} size="24" color="#757575" />
          {/if}
        </div>
      {/if}

      <span class="w-full truncate first-letter:capitalize" title={dayGroup.groupTitle}>
        {dayGroup.groupTitle}
      </span>
    </div>

    <!-- Image grid -->
    <div
      data-image-grid
      class="relative overflow-clip"
      style:height={dayGroup.height + 'px'}
      style:width={dayGroup.width + 'px'}
    >
      {#each filterIntersecting(dayGroup.viewerAssets) as viewerAsset (viewerAsset.id)}
        {@const position = viewerAsset.position!}
        {@const asset = viewerAsset.asset!}

        <!-- note: don't remove data-asset-id - its used by web e2e tests -->
        <div
          data-asset-id={asset.id}
          class="absolute"
          style:top={position.top + 'px'}
          style:left={position.left + 'px'}
          style:width={position.width + 'px'}
          style:height={position.height + 'px'}
          out:scale|global={{ start: 0.1, duration: scaleDuration }}
          animate:flip={{ duration: transitionDuration }}
        >
          <Thumbnail
            showStackedIcon={withStacked}
            {showArchiveIcon}
            {asset}
            {groupIndex}
            onClick={() => onAssetOpen(dayGroup, assetSnapshot(asset))}
            onSelect={() => onAssetSelect(dayGroup, assetSnapshot(asset))}
            onMouseEvent={() => onHover(dayGroup, assetSnapshot(asset))}
            selected={isAssetSelected(asset)}
            selectionCandidate={isAssetSelectionCandidate(asset)}
            disabled={isAssetDisabled(asset)}
            thumbnailWidth={position.width}
            thumbnailHeight={position.height}
          />
        </div>
      {/each}
    </div>
  </section>
{/each}

<style>
  section {
    contain: layout paint style;
  }
  [data-image-grid] {
    user-select: none;
  }
</style>
