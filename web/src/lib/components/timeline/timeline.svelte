<script lang="ts">
  import Portal from '$lib/components/shared-components/portal/portal.svelte';
  import TimelineKeyboardActions from '$lib/components/timeline/actions/timeline-keyboard-actions.svelte';
  import BaseTimeline from '$lib/components/timeline/base-components/base-timeline.svelte';
  import TimelineAssetViewer from '$lib/components/timeline/internal-components/timeline-asset-viewer.svelte';
  import type { AssetAction } from '$lib/constants';
  import type { TimelineManager } from '$lib/managers/timeline-manager/timeline-manager.svelte';
  import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
  import type { AssetInteraction } from '$lib/stores/asset-interaction.svelte';
  import { assetViewingStore } from '$lib/stores/asset-viewing.store';
  import type { AlbumResponseDto, PersonResponseDto } from '@immich/sdk';
  import type { Snippet } from 'svelte';

  let { isViewing: showAssetViewer } = assetViewingStore;

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
      | AssetAction.SET_VISIBILITY_TIMELINE;
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
  }: Props = $props();

  let viewer: BaseTimeline | undefined = $state();
  let showSkeleton: boolean = $state(true);
</script>

<BaseTimeline
  bind:this={viewer}
  {isSelectionMode}
  {singleSelect}
  {enableRouting}
  {timelineManager}
  {assetInteraction}
  {withStacked}
  {showArchiveIcon}
  {isShowDeleteConfirmation}
  {showSkeleton}
  {onSelect}
  {children}
  {empty}
/>

<TimelineKeyboardActions
  scrollToAsset={(asset) => viewer?.scrollToAsset(asset) ?? false}
  {timelineManager}
  {assetInteraction}
  bind:isShowDeleteConfirmation
  {onEscape}
/>

<Portal target="body">
  {#if $showAssetViewer}
    <TimelineAssetViewer bind:showSkeleton {timelineManager} {removeAction} {withStacked} {isShared} {album} {person} />
  {/if}
</Portal>
