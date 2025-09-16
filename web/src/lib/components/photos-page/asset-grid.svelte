<script lang="ts">
  import Timeline from '$lib/components/timeline/timeline.svelte';
  import type { AssetAction } from '$lib/constants';
  import type { DayGroup } from '$lib/managers/timeline-manager/day-group.svelte';
  import type { TimelineManager } from '$lib/managers/timeline-manager/timeline-manager.svelte';
  import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
  import type { AssetInteraction } from '$lib/stores/asset-interaction.svelte';
  import type { AlbumResponseDto, PersonResponseDto } from '@immich/sdk';
  import type { Snippet } from 'svelte';

  interface Props {
    isSelectionMode?: boolean;
    singleSelect?: boolean;
    /** `true` if this asset grid is responds to navigation events; if `true`, then look at the
     `AssetViewingStore.gridScrollTarget` and load and scroll to the asset specified, and
     additionally, update the page location/url with the asset as the asset-grid is scrolled */
    enableRouting: boolean;
    timelineManager: TimelineManager;
    assetInteraction: AssetInteraction;
    removeAction?:
      | AssetAction.UNARCHIVE
      | AssetAction.ARCHIVE
      | AssetAction.FAVORITE
      | AssetAction.UNFAVORITE
      | AssetAction.SET_VISIBILITY_TIMELINE
      | null;
    withStacked?: boolean;
    showArchiveIcon?: boolean;
    isShared?: boolean;
    album?: AlbumResponseDto | null;
    person?: PersonResponseDto | null;
    isShowDeleteConfirmation?: boolean;
    onSelect?: (asset: TimelineAsset) => void;
    onEscape?: () => void;
    children?: Snippet;
    empty?: Snippet;
    customLayout?: Snippet<[TimelineAsset]>;
    onThumbnailClick?: (
      asset: TimelineAsset,
      timelineManager: TimelineManager,
      dayGroup: DayGroup,
      onClick: (
        timelineManager: TimelineManager,
        assets: TimelineAsset[],
        groupTitle: string,
        asset: TimelineAsset,
      ) => void,
    ) => void;
  }

  let {
    isSelectionMode = false,
    singleSelect = false,
    enableRouting,
    timelineManager = $bindable(),
    assetInteraction,
    removeAction,
    withStacked = false,
    showArchiveIcon = false,
    isShared = false,
    album = null,
    person = null,
    isShowDeleteConfirmation = $bindable(false),
    onSelect = () => {},
    onEscape = () => {},
    children,
    empty,
    customLayout,
    onThumbnailClick,
  }: Props = $props();

  const onAssetOpen = (dayGroup: DayGroup, asset: TimelineAsset, defaultAssetOpen: () => void) => {
    if (onThumbnailClick) {
      onThumbnailClick(asset, timelineManager, dayGroup, () => defaultAssetOpen());
      return;
    }
    defaultAssetOpen();
  };
</script>

<!-- AssetGrid Adapter: This is a compatibility layer that wraps the new Timeline component -->
<!-- It maintains the old AssetGrid API while using the new Timeline implementation underneath -->
<Timeline
  {isSelectionMode}
  {singleSelect}
  {enableRouting}
  bind:timelineManager
  {assetInteraction}
  {removeAction}
  {withStacked}
  {showArchiveIcon}
  {isShared}
  {album}
  {person}
  bind:isShowDeleteConfirmation
  {onAssetOpen}
  {onSelect}
  {onEscape}
  {children}
  {empty}
  customThumbnailLayout={customLayout}
/>
