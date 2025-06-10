<script lang="ts">
  import Icon from '$lib/components/elements/icon.svelte';
  import type { AssetInteraction } from '$lib/stores/asset-interaction.svelte';
  import { isSelectingAllAssets } from '$lib/stores/assets-store.svelte';
  import type { AssetStore } from '$lib/managers/timeline-manager/asset-store.svelte';
  import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
  import { assetSnapshot, assetsSnapshot } from '$lib/managers/timeline-manager/utils.svelte';
  import { navigate } from '$lib/utils/navigation';

  import { mdiCheckCircle, mdiCircleOutline } from '@mdi/js';
  import { fly, scale } from 'svelte/transition';
  import Thumbnail from '../assets/thumbnail/thumbnail.svelte';

  import type { AssetBucket } from '$lib/managers/timeline-manager/asset-bucket.svelte';
  import { uploadAssetsStore } from '$lib/stores/upload';
  import { t } from 'svelte-i18n';
  import { flip } from 'svelte/animate';

  let { isUploading } = uploadAssetsStore;

  interface Props {
    isSelectionMode: boolean;
    singleSelect: boolean;
    withStacked: boolean;
    showArchiveIcon: boolean;
    bucket: AssetBucket;
    assetStore: AssetStore;
    assetInteraction: AssetInteraction;

    onSelect: ({ title, assets }: { title: string; assets: TimelineAsset[] }) => void;
    onSelectAssets: (asset: TimelineAsset) => void;
    onSelectAssetCandidates: (asset: TimelineAsset | null) => void;
    onScrollCompensation: (compensation: { heightDelta?: number; scrollTop?: number }) => void;
  }

  let {
    isSelectionMode,
    singleSelect,
    withStacked,
    showArchiveIcon,
    bucket = $bindable(),
    assetInteraction,
    assetStore,
    onSelect,
    onSelectAssets,
    onSelectAssetCandidates,
    onScrollCompensation,
  }: Props = $props();

  let isMouseOverGroup = $state(false);
  let hoveredDateGroup = $state();

  const transitionDuration = $derived.by(() => (bucket.store.suspendTransitions && !$isUploading ? 0 : 150));
  const scaleDuration = $derived(transitionDuration === 0 ? 0 : transitionDuration + 100);
  const onClick = (assetStore: AssetStore, assets: TimelineAsset[], groupTitle: string, asset: TimelineAsset) => {
    if (isSelectionMode || assetInteraction.selectionActive) {
      assetSelectHandler(assetStore, asset, assets, groupTitle);
      return;
    }
    void navigate({ targetRoute: 'current', assetId: asset.id });
  };

  const handleSelectGroup = (title: string, assets: TimelineAsset[]) => onSelect({ title, assets });

  const assetSelectHandler = (
    assetStore: AssetStore,
    asset: TimelineAsset,
    assetsInDateGroup: TimelineAsset[],
    groupTitle: string,
  ) => {
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

    if (assetStore.count == assetInteraction.selectedAssets.length) {
      isSelectingAllAssets.set(true);
    } else {
      isSelectingAllAssets.set(false);
    }
  };

  const assetMouseEventHandler = (groupTitle: string, asset: TimelineAsset | null) => {
    // Show multi select icon on hover on date group
    hoveredDateGroup = groupTitle;

    if (assetInteraction.selectionActive) {
      onSelectAssetCandidates(asset);
    }
  };

  function filterIntersecting<R extends { intersecting: boolean }>(intersectable: R[]) {
    return intersectable.filter((int) => int.intersecting);
  }

  $effect.root(() => {
    if (assetStore.scrollCompensation.bucket === bucket) {
      onScrollCompensation(assetStore.scrollCompensation);
      assetStore.clearScrollCompensation();
    }
  });
</script>

{#each filterIntersecting(bucket.dateGroups) as dateGroup, groupIndex (dateGroup.day)}
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
      class="flex pt-7 pb-5 max-md:pt-5 max-md:pb-3 h-6 place-items-center text-xs font-medium text-immich-fg dark:text-immich-dark-fg md:text-sm"
      style:width={dateGroup.width + 'px'}
    >
      {#if !singleSelect && ((hoveredDateGroup === dateGroup.groupTitle && isMouseOverGroup) || assetInteraction.selectedGroup.has(dateGroup.groupTitle))}
        <div
          transition:fly={{ x: -24, duration: 200, opacity: 0.5 }}
          class="inline-block px-2 hover:cursor-pointer"
          onclick={() => handleSelectGroup(dateGroup.groupTitle, assetsSnapshot(dateGroup.getAssets()))}
          onkeydown={() => handleSelectGroup(dateGroup.groupTitle, assetsSnapshot(dateGroup.getAssets()))}
        >
          {#if assetInteraction.selectedGroup.has(dateGroup.groupTitle)}
            <Icon
              path={mdiCheckCircle}
              size="24"
              color="#4250af"
              role="button"
              ariaLabel={$t('unselect_all_in', { values: { group: dateGroup.groupTitle } })}
            />
          {:else}
            <Icon
              path={mdiCircleOutline}
              size="24"
              color="#757575"
              role="button"
              ariaLabel={$t('select_all_in', { values: { group: dateGroup.groupTitle } })}
            />
          {/if}
        </div>
      {/if}

      <span class="w-full truncate first-letter:capitalize ms-2.5" title={dateGroup.groupTitle}>
        {dateGroup.groupTitle}
      </span>
    </div>

    <!-- Image grid -->
    <div
      data-image-grid
      class="relative overflow-clip"
      style:height={dateGroup.height + 'px'}
      style:width={dateGroup.width + 'px'}
    >
      {#each filterIntersecting(dateGroup.intersectingAssets) as intersectingAsset (intersectingAsset.id)}
        {@const position = intersectingAsset.position!}
        {@const asset = intersectingAsset.asset!}

        <!-- {#if intersectingAsset.intersecting} -->
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
            onClick={(asset) => onClick(assetStore, dateGroup.getAssets(), dateGroup.groupTitle, asset)}
            onSelect={(asset) => assetSelectHandler(assetStore, asset, dateGroup.getAssets(), dateGroup.groupTitle)}
            onMouseEvent={() => assetMouseEventHandler(dateGroup.groupTitle, assetSnapshot(asset))}
            selected={assetInteraction.hasSelectedAsset(asset.id) || dateGroup.bucket.store.albumAssets.has(asset.id)}
            selectionCandidate={assetInteraction.hasSelectionCandidate(asset.id)}
            disabled={dateGroup.bucket.store.albumAssets.has(asset.id)}
            thumbnailWidth={position.width}
            thumbnailHeight={position.height}
          />
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
