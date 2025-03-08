<script lang="ts">
  import Icon from '$lib/components/elements/icon.svelte';
  import { AssetBucket } from '$lib/stores/assets-store.svelte';
  import { navigate } from '$lib/utils/navigation';
  import type { AssetResponseDto } from '@immich/sdk';
  import { mdiCheckCircle, mdiCircleOutline } from '@mdi/js';
  import { fly } from 'svelte/transition';
  import Thumbnail from '../assets/thumbnail/thumbnail.svelte';
  import type { AssetInteraction } from '$lib/stores/asset-interaction.svelte';

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
    bucket,
    assetInteraction,
    onSelect,
    onSelectAssets,
    onSelectAssetCandidates,
  }: Props = $props();

  let isMouseOverGroup = $state(false);
  let hoveredDateGroup = $state();

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
      assetInteraction.selectedAssets.has(asset),
    ).length;

    // if all assets are selected in a group, add the group to selected group
    if (selectedAssetsInGroupCount == assetsInDateGroup.length) {
      assetInteraction.addGroupToMultiselectGroup(groupTitle);
    } else {
      assetInteraction.removeGroupFromMultiselectGroup(groupTitle);
    }
  };

  const assetMouseEventHandler = (groupTitle: string, asset: AssetResponseDto | null) => {
    // Show multi select icon on hover on date group
    hoveredDateGroup = groupTitle;

    if (assetInteraction.selectionActive) {
      onSelectAssetCandidates(asset);
    }
  };
</script>

{#each bucket.dateGroups as dateGroup, groupIndex (dateGroup.date)}
  {@const geometry = dateGroup.geometry!}
  {@const display = dateGroup.intersecting}
  {@const absoluteWidth = dateGroup.left}
  {#if display}
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <section
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
        style:width={geometry.containerWidth + 'px'}
      >
        {#if !singleSelect && ((hoveredDateGroup === dateGroup.groupTitle && isMouseOverGroup) || assetInteraction.selectedGroup.has(dateGroup.groupTitle))}
          <div
            transition:fly={{ x: -24, duration: 200, opacity: 0.5 }}
            class="inline-block px-2 hover:cursor-pointer"
            onclick={() => handleSelectGroup(dateGroup.groupTitle, dateGroup.assets)}
            onkeydown={() => handleSelectGroup(dateGroup.groupTitle, dateGroup.assets)}
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
        {#each dateGroup.assetsIntersecting as intersectingAsset (intersectingAsset.id)}
          {#if intersectingAsset.intersecting}
            {@const position = intersectingAsset.position}
            {@const asset = intersectingAsset.asset}
            <!-- note: don't remove data-asset-id - its used by web e2e tests -->
            <div
              data-asset-id={asset.id}
              class="absolute"
              style:top={position.top + 'px'}
              style:left={position.left + 'px'}
              style:width={position.width + 'px'}
              style:height={position.height + 'px'}
            >
              <Thumbnail
                showStackedIcon={withStacked}
                {showArchiveIcon}
                asset={intersectingAsset.asset}
                {groupIndex}
                onClick={(asset) => onClick(dateGroup.assets, dateGroup.groupTitle, asset)}
                onSelect={(asset) => assetSelectHandler(asset, dateGroup.assets, dateGroup.groupTitle)}
                onMouseEvent={() => assetMouseEventHandler(dateGroup.groupTitle, intersectingAsset.asset)}
                selected={assetInteraction.selectedAssets.has(asset) ||
                  dateGroup.bucket.store.albumAssets.has(asset.id)}
                selectionCandidate={assetInteraction.assetSelectionCandidates.has(intersectingAsset.asset)}
                disabled={dateGroup.bucket.store.albumAssets.has(asset.id)}
                thumbnailWidth={position.width}
                thumbnailHeight={position.height}
              />
            </div>
          {/if}
        {/each}
      </div>
    </section>
  {/if}
{/each}

<style>
  section {
    contain: layout paint style;
  }
</style>
