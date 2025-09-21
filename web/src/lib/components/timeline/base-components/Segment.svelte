<script lang="ts">
  import type { MonthGroup } from '$lib/managers/timeline-manager/month-group.svelte';
  import type { TimelineManager } from '$lib/managers/timeline-manager/timeline-manager.svelte';
  import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
  import { assetsSnapshot } from '$lib/managers/timeline-manager/utils.svelte';
  import { uploadAssetsStore } from '$lib/stores/upload';
  import { Icon } from '@immich/ui';
  import { mdiCheckCircle, mdiCircleOutline } from '@mdi/js';

  import { fly } from 'svelte/transition';

  import AssetLayout from '$lib/components/timeline/base-components/AssetLayout.svelte';
  import { DayGroup } from '$lib/managers/timeline-manager/day-group.svelte';
  import type { AssetInteraction } from '$lib/stores/asset-interaction.svelte';
  import type { CommonPosition } from '$lib/utils/layout-utils';
  import type { Snippet } from 'svelte';

  let { isUploading } = uploadAssetsStore;

  interface Props {
    thumbnail: Snippet<[{ asset: TimelineAsset; position: CommonPosition; dayGroup: DayGroup; groupIndex: number }]>;
    customThumbnailLayout?: Snippet<[TimelineAsset]>;

    singleSelect: boolean;
    assetInteraction: AssetInteraction;
    monthGroup: MonthGroup;
    timelineManager: TimelineManager;

    onDayGroupSelect: (daygroup: DayGroup, assets: TimelineAsset[]) => void;
  }

  let {
    thumbnail: thumbnailWithGroup,
    customThumbnailLayout,
    singleSelect,
    assetInteraction,
    monthGroup,
    timelineManager,
    onDayGroupSelect,
  }: Props = $props();

  let isMouseOverGroup = $state(false);
  let hoveredDayGroup = $state();

  const transitionDuration = $derived.by(() =>
    monthGroup.timelineManager.suspendTransitions && !$isUploading ? 0 : 150,
  );

  function filterIntersecting<R extends { intersecting: boolean }>(intersectables: R[]) {
    return intersectables.filter((intersectable) => intersectable.intersecting);
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
      {#if !singleSelect && ((hoveredDayGroup === dayGroup.groupTitle && isMouseOverGroup) || isDayGroupSelected)}
        <div
          transition:fly={{ x: -24, duration: 200, opacity: 0.5 }}
          class="inline-block pe-2 hover:cursor-pointer"
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

      <span class="w-full truncate first-letter:capitalize" title={dayGroup.groupTitleFull}>
        {dayGroup.groupTitle}
      </span>
    </div>

    <AssetLayout
      photostreamManager={timelineManager}
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
