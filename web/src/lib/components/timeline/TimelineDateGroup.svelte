<script lang="ts">
  import Thumbnail from '$lib/components/assets/thumbnail/thumbnail.svelte';
  import type { TimelineDay } from '$lib/managers/timeline-manager/TimelineDay.svelte';
  import type { TimelineManager } from '$lib/managers/timeline-manager/TimelineManager.svelte';
  import type { TimelineMonth } from '$lib/managers/timeline-manager/TimelineMonth.svelte';
  import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
  import { assetSnapshot, assetsSnapshot } from '$lib/managers/timeline-manager/utils.svelte';
  import type { AssetInteraction } from '$lib/stores/asset-interaction.svelte';
  import { isSelectingAllAssets } from '$lib/stores/assets-store.svelte';
  import { uploadAssetsStore } from '$lib/stores/upload';
  import { navigate } from '$lib/utils/navigation';
  import { fromTimelinePlainDate, getDateLocaleString } from '$lib/utils/timeline-util';
  import { Icon } from '@immich/ui';
  import { mdiCheckCircle, mdiCircleOutline } from '@mdi/js';
  import { type Snippet } from 'svelte';
  import { flip } from 'svelte/animate';
  import { scale } from 'svelte/transition';

  let { isUploading } = uploadAssetsStore;

  interface Props {
    isSelectionMode: boolean;
    singleSelect: boolean;
    withStacked: boolean;
    showArchiveIcon: boolean;
    month: TimelineMonth;
    timelineManager: TimelineManager;
    assetInteraction: AssetInteraction;
    customLayout?: Snippet<[TimelineAsset]>;

    onSelect: ({ title, assets }: { title: string; assets: TimelineAsset[] }) => void;
    onSelectAssets: (asset: TimelineAsset) => void;
    onSelectAssetCandidates: (asset: TimelineAsset | null) => void;
    onThumbnailClick?: (
      asset: TimelineAsset,
      timelineManager: TimelineManager,
      day: TimelineDay,
      onClick: (
        timelineManager: TimelineManager,
        assets: TimelineAsset[],
        groupTitle: string,
        asset: TimelineAsset,
      ) => void,
    ) => void;
  }

  let {
    isSelectionMode,
    singleSelect,
    withStacked,
    showArchiveIcon,
    month: monthGroup = $bindable(),
    assetInteraction,
    timelineManager,
    customLayout,
    onSelect,
    onSelectAssets,
    onSelectAssetCandidates,

    onThumbnailClick,
  }: Props = $props();

  let isMouseOverGroup = $state(false);
  let hoveredDayGroup = $state();

  const transitionDuration = $derived.by(() =>
    monthGroup.scrollManager.suspendTransitions && !$isUploading ? 0 : 150,
  );
  const scaleDuration = $derived(transitionDuration === 0 ? 0 : transitionDuration + 100);
  const _onClick = (
    timelineManager: TimelineManager,
    assets: TimelineAsset[],
    groupTitle: string,
    asset: TimelineAsset,
  ) => {
    if (isSelectionMode || assetInteraction.selectionActive) {
      assetSelectHandler(timelineManager, asset, assets, groupTitle);
      return;
    }
    void navigate({ targetRoute: 'current', assetId: asset.id });
  };

  const handleSelectGroup = (title: string, assets: TimelineAsset[]) => onSelect({ title, assets });

  const assetSelectHandler = (
    timelineManager: TimelineManager,
    asset: TimelineAsset,
    assetsInDayGroup: TimelineAsset[],
    groupTitle: string,
  ) => {
    onSelectAssets(asset);

    // Check if all assets are selected in a group to toggle the group selection's icon
    let selectedAssetsInGroupCount = assetsInDayGroup.filter((asset) =>
      assetInteraction.hasSelectedAsset(asset.id),
    ).length;

    // if all assets are selected in a group, add the group to selected group
    if (selectedAssetsInGroupCount == assetsInDayGroup.length) {
      assetInteraction.addGroupToMultiselectGroup(groupTitle);
    } else {
      assetInteraction.removeGroupFromMultiselectGroup(groupTitle);
    }

    if (timelineManager.assetCount == assetInteraction.selectedAssets.length) {
      isSelectingAllAssets.set(true);
    } else {
      isSelectingAllAssets.set(false);
    }
  };

  const assetMouseEventHandler = (groupTitle: string, asset: TimelineAsset | null) => {
    // Show multi select icon on hover on date group
    hoveredDayGroup = groupTitle;

    if (assetInteraction.selectionActive) {
      onSelectAssetCandidates(asset);
    }
  };

  function filterIntersecting<R extends { intersecting: boolean }>(intersectable: R[]) {
    return intersectable.filter((int) => int.intersecting);
  }

  const getDayGroupFullDate = (day: TimelineDay): string => {
    const { month, year } = day.month.yearMonth;
    const date = fromTimelinePlainDate({
      year,
      month,
      day: day.day,
    });
    return getDateLocaleString(date);
  };
</script>

{#each filterIntersecting(monthGroup.days) as day, groupIndex (day.day)}
  {@const absoluteWidth = day.left}

  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <section
    class={[
      { 'transition-all': !monthGroup.scrollManager.suspendTransitions },
      !monthGroup.scrollManager.suspendTransitions && `delay-${transitionDuration}`,
    ]}
    data-group
    style:position="absolute"
    style:transform={`translate3d(${absoluteWidth}px,${day.top}px,0)`}
    onmouseenter={() => {
      isMouseOverGroup = true;
      assetMouseEventHandler(day.dayTitle, null);
    }}
    onmouseleave={() => {
      isMouseOverGroup = false;
      assetMouseEventHandler(day.dayTitle, null);
    }}
  >
    <!-- Date group title -->
    <div
      class="flex pt-7 pb-5 max-md:pt-5 max-md:pb-3 h-6 place-items-center text-xs font-medium text-immich-fg dark:text-immich-dark-fg md:text-sm"
      style:width={day.width + 'px'}
    >
      {#if !singleSelect}
        <div
          class="hover:cursor-pointer transition-all duration-200 ease-out overflow-hidden w-0"
          class:w-8={(hoveredDayGroup === day.dayTitle && isMouseOverGroup) ||
            assetInteraction.selectedGroup.has(day.dayTitle)}
          onclick={() => handleSelectGroup(day.dayTitle, assetsSnapshot(day.getAssets()))}
          onkeydown={() => handleSelectGroup(day.dayTitle, assetsSnapshot(day.getAssets()))}
        >
          {#if assetInteraction.selectedGroup.has(day.dayTitle)}
            <Icon icon={mdiCheckCircle} size="24" class="text-primary" />
          {:else}
            <Icon icon={mdiCircleOutline} size="24" color="#757575" />
          {/if}
        </div>
      {/if}

      <span class="w-full truncate first-letter:capitalize" title={getDayGroupFullDate(day)}>
        {day.dayTitle}
      </span>
    </div>

    <!-- Image grid -->
    <div data-image-grid class="relative overflow-clip" style:height={day.height + 'px'} style:width={day.width + 'px'}>
      {#each filterIntersecting(day.viewerAssets) as viewerAsset (viewerAsset.id)}
        {@const position = viewerAsset.position!}
        {@const asset = viewerAsset.asset!}

        <!-- {#if viewerAsset.intersecting} -->
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
            onClick={(asset) => {
              if (typeof onThumbnailClick === 'function') {
                onThumbnailClick(asset, timelineManager, day, _onClick);
              } else {
                _onClick(timelineManager, day.getAssets(), day.dayTitle, asset);
              }
            }}
            onSelect={(asset) => assetSelectHandler(timelineManager, asset, day.getAssets(), day.dayTitle)}
            onMouseEvent={() => assetMouseEventHandler(day.dayTitle, assetSnapshot(asset))}
            selected={assetInteraction.hasSelectedAsset(asset.id) || day.month.scrollManager.albumAssets.has(asset.id)}
            selectionCandidate={assetInteraction.hasSelectionCandidate(asset.id)}
            disabled={day.month.scrollManager.albumAssets.has(asset.id)}
            thumbnailWidth={position.width}
            thumbnailHeight={position.height}
          />
          {#if customLayout}
            {@render customLayout(asset)}
          {/if}
        </div>
        <!-- {/if} -->
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
