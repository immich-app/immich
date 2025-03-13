<script lang="ts">
  import Icon from '$lib/components/elements/icon.svelte';
  import { AssetBucket } from '$lib/stores/assets-store.svelte';
  import { navigate } from '$lib/utils/navigation';
  import { findTotalOffset, type DateGroup, type ScrollTargetListener } from '$lib/utils/timeline-util';
  import type { AssetResponseDto } from '@immich/sdk';
  import { mdiCheckCircle, mdiCircleOutline } from '@mdi/js';
  import { fly } from 'svelte/transition';
  import Thumbnail from '../assets/thumbnail/thumbnail.svelte';
  import type { AssetInteraction } from '$lib/stores/asset-interaction.svelte';
  import { scale } from 'svelte/transition';

  import { flip } from 'svelte/animate';

  import { uploadAssetsStore } from '$lib/stores/upload';

  let { isUploading } = uploadAssetsStore;

  interface Props {
    isSelectionMode: boolean;
    singleSelect: boolean;
    withStacked: boolean;
    showArchiveIcon: boolean;
    bucket: AssetBucket;
    assetInteraction: AssetInteraction;

    onSelect: ({ title, assets }: { title: string; assets: AssetResponseDto[] }) => void;
    onSelectAssets: (asset: AssetResponseDto) => void;
    onSelectAssetCandidates: (asset: AssetResponseDto | null) => void;
  }

  let {
    isSelectionMode,
    singleSelect,
    withStacked,
    showArchiveIcon,
    bucket = $bindable(),
    assetInteraction,
    onSelect,
    onSelectAssets,
    onSelectAssetCandidates,
  }: Props = $props();

  let isMouseOverGroup = $state(false);
  let hoveredDateGroup = $state();

  const transitionDuration = $derived.by(() => (bucket.store.suspendTransitions && !$isUploading ? 0 : 150));

  const onClick = (assets: AssetResponseDto[], groupTitle: string, asset: AssetResponseDto) => {
    if (isSelectionMode || assetInteraction.selectionActive) {
      assetSelectHandler(asset, assets, groupTitle);
      return;
    }
    void navigate({ targetRoute: 'current', assetId: asset.id });
  };

  const handleSelectGroup = (title: string, assets: AssetResponseDto[]) => onSelect({ title, assets });

  const assetSelectHandler = (asset: AssetResponseDto, assetsInDateGroup: AssetResponseDto[], groupTitle: string) => {
    onSelectAssets(asset);

    // Check if all assets are selected in a group to toggle the group selection's icon
    let selectedAssetsInGroupCount = assetsInDateGroup.filter((asset) =>
      assetInteraction.hasSelectedAsset(asset.id),
    ).length;

    // if all assets are selected in a group, add the group to selected group
    if (selectedAssetsInGroupCount == assetsInDateGroup.length) {
      assetInteraction.addGroupToMultiselectGroup(groupTitle);
    } else {
      assetInteraction.removeGroupFromMultiselectGroup(groupTitle);
    }
  };
  const snapshotAssetArray = (assets: AssetResponseDto[]) => {
    return assets.map((a) => $state.snapshot(a));
  };
  const assetMouseEventHandler = (groupTitle: string, asset: AssetResponseDto | null) => {
    // Show multi select icon on hover on date group
    hoveredDateGroup = groupTitle;

    if (assetInteraction.selectionActive) {
      onSelectAssetCandidates(asset);
    }
  };

  const assetOnFocusHandler = (asset: AssetResponseDto) => {
    assetInteraction.focussedAssetId = asset.id;
  };
  function filterIntersecting<R extends { intersecting: boolean }>(intersectable: R[]) {
    return intersectable.filter((int) => int.intersecting);
  }
</script>

{#each filterIntersecting(bucket.dateGroups) as dateGroup, groupIndex (dateGroup.date)}
  {@const absoluteWidth = dateGroup.left}

  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <section
    class={[
      { 'transition-all': !bucket.store.suspendTransitions },
      !bucket.store.suspendTransitions && `delay-${transitionDuration}`,
    ]}
    data-group
    style:position="absolute"
    style:transform={`translate3d(${absoluteWidth}px,${dateGroup.top}px,0)`}
    onmouseenter={() => {
      isMouseOverGroup = true;
      assetMouseEventHandler(dateGroup.groupTitle, null);
    }}
    onmouseleave={() => {
      isMouseOverGroup = false;
      assetMouseEventHandler(dateGroup.groupTitle, null);
    }}
  >
    <!-- Date group title -->
    <div
      class="flex z-[100] pt-[calc(1.75rem+1px)] pb-5 h-6 place-items-center text-xs font-medium text-immich-fg bg-immich-bg dark:bg-immich-dark-bg dark:text-immich-dark-fg md:text-sm"
      style:width={dateGroup.width + 'px'}
    >
      {#if !singleSelect && ((hoveredDateGroup === dateGroup.groupTitle && isMouseOverGroup) || assetInteraction.selectedGroup.has(dateGroup.groupTitle))}
        <div
          transition:fly={{ x: -24, duration: 200, opacity: 0.5 }}
          class="inline-block px-2 hover:cursor-pointer"
          onclick={() => handleSelectGroup(dateGroup.groupTitle, snapshotAssetArray(dateGroup.getAssets()))}
          onkeydown={() => handleSelectGroup(dateGroup.groupTitle, snapshotAssetArray(dateGroup.getAssets()))}
        >
          {#if assetInteraction.selectedGroup.has(dateGroup.groupTitle)}
            <Icon path={mdiCheckCircle} size="24" color="#4250af" />
          {:else}
            <Icon path={mdiCircleOutline} size="24" color="#757575" />
          {/if}
        </div>
      {/if}

      <span class="w-full truncate first-letter:capitalize" title={dateGroup.groupTitle}>
        {dateGroup.groupTitle}
      </span>
    </div>

          <!-- Image grid -->
          <div
            class="relative overflow-clip"
            style:height={geometry.containerHeight + 'px'}
            style:width={geometry.containerWidth + 'px'}
          >
            {#each dateGroup.assets as asset, i (asset.id)}
              <!-- getting these together here in this order is very cache-efficient -->
              {@const top = geometry.getTop(i)}
              {@const left = geometry.getLeft(i)}
              {@const width = geometry.getWidth(i)}
              {@const height = geometry.getHeight(i)}
              <!-- update ASSET_GRID_PADDING-->
              <div
                use:intersectionObserver={{
                  onIntersect: () => onAssetInGrid?.(asset),
                  top: `${-TITLE_HEIGHT}px`,
                  bottom: `${-(viewport.height - TITLE_HEIGHT - 1)}px`,
                  right: `${-(viewport.width - 1)}px`,
                  root: assetGridElement,
                }}
                data-asset-id={asset.id}
                class="absolute"
                style:top={top + 'px'}
                style:left={left + 'px'}
                style:width={width + 'px'}
                style:height={height + 'px'}
              >
                <Thumbnail
                  {dateGroup}
                  {assetStore}
                  intersectionConfig={{
                    root: assetGridElement,
                    bottom: renderThumbsAtBottomMargin,
                    top: renderThumbsAtTopMargin,
                  }}
                  retrieveElement={assetStore.pendingScrollAssetId === asset.id}
                  onRetrieveElement={(element) => onRetrieveElement(dateGroup, asset, element)}
                  showStackedIcon={withStacked}
                  {showArchiveIcon}
                  {asset}
                  {groupIndex}
                  onClick={(asset) => onClick(dateGroup.assets, dateGroup.groupTitle, asset)}
                  onSelect={(asset) => assetSelectHandler(asset, dateGroup.assets, dateGroup.groupTitle)}
                  onMouseEvent={() => assetMouseEventHandler(dateGroup.groupTitle, asset)}
                  selected={assetInteraction.selectedAssets.has(asset) || assetStore.albumAssets.has(asset.id)}
                  selectionCandidate={assetInteraction.assetSelectionCandidates.has(asset)}
                  handleFocus={() => assetOnFocusHandler(asset)}
                  focussed={assetInteraction.isFocussedAsset(asset)}
                  disabled={assetStore.albumAssets.has(asset.id)}
                  thumbnailWidth={width}
                  thumbnailHeight={height}
                />
              </div>
            {/each}
          </div>
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
</style>
