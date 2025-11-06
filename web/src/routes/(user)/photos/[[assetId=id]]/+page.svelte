<script lang="ts">
  import { beforeNavigate } from '$app/navigation';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import MemoryLane from '$lib/components/photos-page/memory-lane.svelte';
  import ButtonContextMenu from '$lib/components/shared-components/context-menu/button-context-menu.svelte';
  import EmptyPlaceholder from '$lib/components/shared-components/empty-placeholder.svelte';
  import AddToAlbum from '$lib/components/timeline/actions/AddToAlbumAction.svelte';
  import ArchiveAction from '$lib/components/timeline/actions/ArchiveAction.svelte';
  import AssetJobActions from '$lib/components/timeline/actions/AssetJobActions.svelte';
  import ChangeDate from '$lib/components/timeline/actions/ChangeDateAction.svelte';
  import ChangeDescription from '$lib/components/timeline/actions/ChangeDescriptionAction.svelte';
  import ChangeLocation from '$lib/components/timeline/actions/ChangeLocationAction.svelte';
  import CreateSharedLink from '$lib/components/timeline/actions/CreateSharedLinkAction.svelte';
  import DeleteAssets from '$lib/components/timeline/actions/DeleteAssetsAction.svelte';
  import DownloadAction from '$lib/components/timeline/actions/DownloadAction.svelte';
  import FavoriteAction from '$lib/components/timeline/actions/FavoriteAction.svelte';
  import LinkLivePhotoAction from '$lib/components/timeline/actions/LinkLivePhotoAction.svelte';
  import SelectAllAssets from '$lib/components/timeline/actions/SelectAllAction.svelte';
  import SetVisibilityAction from '$lib/components/timeline/actions/SetVisibilityAction.svelte';
  import StackAction from '$lib/components/timeline/actions/StackAction.svelte';
  import TagAction from '$lib/components/timeline/actions/TagAction.svelte';
  import AssetSelectControlBar from '$lib/components/timeline/AssetSelectControlBar.svelte';
  import Timeline from '$lib/components/timeline/Timeline.svelte';
  import { AssetAction } from '$lib/constants';
  import { TimelineManager } from '$lib/managers/timeline-manager/timeline-manager.svelte';
  import TimelineSettingsModal from '$lib/modals/TimelineSettingsModal.svelte';
  import { AssetInteraction } from '$lib/stores/asset-interaction.svelte';
  import { assetViewingStore } from '$lib/stores/asset-viewing.store';
  import { isFaceEditMode } from '$lib/stores/face-edit.svelte';
  import { preferences, user } from '$lib/stores/user.store';
  import { timelineSettings } from '$lib/stores/preferences.store';
  import {
    updateStackedAssetInTimeline,
    updateUnstackedAssetInTimeline,
    type OnLink,
    type OnUnlink,
  } from '$lib/utils/actions';
  import { openFileUploadDialog } from '$lib/utils/file-uploader';
  import { AssetVisibility } from '@immich/sdk';

  import { mdiCog, mdiDotsVertical, mdiPlus } from '@mdi/js';
  import { IconButton } from '@immich/ui';

  import { t } from 'svelte-i18n';

  let { isViewing: showAssetViewer } = assetViewingStore;
  let timelineManager = $state<TimelineManager>() as TimelineManager;
  let showTimelineSettings = $state(false);

  let options = $derived({
    visibility: AssetVisibility.Timeline,
    withStacked: true,
    withPartners: $timelineSettings.withPartners,
    withSharedAlbums: $timelineSettings.withSharedAlbums,
  });

  const assetInteraction = new AssetInteraction();

  const handleTimelineSettings = (settings?: typeof $timelineSettings) => {
    showTimelineSettings = false;
    if (settings) {
      $timelineSettings = settings;
    }
  };

  let selectedAssets = $derived(assetInteraction.selectedAssets);
  let isAssetStackSelected = $derived(selectedAssets.length === 1 && !!selectedAssets[0].stack);
  let isLinkActionAvailable = $derived.by(() => {
    const isLivePhoto = selectedAssets.length === 1 && !!selectedAssets[0].livePhotoVideoId;
    const isLivePhotoCandidate =
      selectedAssets.length === 2 &&
      selectedAssets.some((asset) => asset.isImage) &&
      selectedAssets.some((asset) => asset.isVideo);

    return assetInteraction.isAllUserOwned && (isLivePhoto || isLivePhotoCandidate);
  });
  const handleEscape = () => {
    if ($showAssetViewer) {
      return;
    }
    if (assetInteraction.selectionActive) {
      assetInteraction.clearMultiselect();
      return;
    }
  };

  const handleLink: OnLink = ({ still, motion }) => {
    timelineManager.removeAssets([motion.id]);
    timelineManager.updateAssets([still]);
  };

  const handleUnlink: OnUnlink = ({ still, motion }) => {
    timelineManager.addAssets([motion]);
    timelineManager.updateAssets([still]);
  };

  const handleSetVisibility = (assetIds: string[]) => {
    timelineManager.removeAssets(assetIds);
    assetInteraction.clearMultiselect();
  };

  beforeNavigate(() => {
    isFaceEditMode.value = false;
  });
</script>

<UserPageLayout hideNavbar={assetInteraction.selectionActive} showUploadButton scrollbar={false}>
  <Timeline
    enableRouting={true}
    bind:timelineManager
    {options}
    {assetInteraction}
    removeAction={AssetAction.ARCHIVE}
    onEscape={handleEscape}
    withStacked
  >
    {#if $preferences.memories.enabled}
      <MemoryLane />
    {/if}
    {#snippet empty()}
      <EmptyPlaceholder text={$t('no_assets_message')} onClick={() => openFileUploadDialog()} />
    {/snippet}
  </Timeline>
</UserPageLayout>

{#if !assetInteraction.selectionActive}
  <button
    type="button"
    class="fixed bottom-6 right-6 z-50 rounded-full bg-immich-primary p-4 text-white shadow-lg hover:bg-immich-primary/90 dark:bg-immich-dark-primary dark:hover:bg-immich-dark-primary/90"
    title={$t('timeline_settings')}
    onclick={() => (showTimelineSettings = true)}
  >
    <svg class="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
      <path d={mdiCog} />
    </svg>
  </button>
{/if}

{#if showTimelineSettings}
  <TimelineSettingsModal settings={$timelineSettings} onClose={handleTimelineSettings} />
{/if}

{#if assetInteraction.selectionActive}
  <AssetSelectControlBar
    ownerId={$user.id}
    assets={assetInteraction.selectedAssets}
    clearSelect={() => assetInteraction.clearMultiselect()}
  >
    <CreateSharedLink />
    <SelectAllAssets {timelineManager} {assetInteraction} />
    <ButtonContextMenu icon={mdiPlus} title={$t('add_to')}>
      <AddToAlbum />
      <AddToAlbum shared />
    </ButtonContextMenu>
    <FavoriteAction
      removeFavorite={assetInteraction.isAllFavorite}
      onFavorite={(ids, isFavorite) =>
        timelineManager.updateAssetOperation(ids, (asset) => {
          asset.isFavorite = isFavorite;
          return { remove: false };
        })}
    ></FavoriteAction>
    <ButtonContextMenu icon={mdiDotsVertical} title={$t('menu')}>
      <DownloadAction menuItem />
      {#if assetInteraction.selectedAssets.length > 1 || isAssetStackSelected}
        <StackAction
          unstack={isAssetStackSelected}
          onStack={(result) => updateStackedAssetInTimeline(timelineManager, result)}
          onUnstack={(assets) => updateUnstackedAssetInTimeline(timelineManager, assets)}
        />
      {/if}
      {#if isLinkActionAvailable}
        <LinkLivePhotoAction
          menuItem
          unlink={assetInteraction.selectedAssets.length === 1}
          onLink={handleLink}
          onUnlink={handleUnlink}
        />
      {/if}
      <ChangeDate menuItem />
      <ChangeDescription menuItem />
      <ChangeLocation menuItem />
      <ArchiveAction menuItem onArchive={(assetIds) => timelineManager.removeAssets(assetIds)} />
      {#if $preferences.tags.enabled}
        <TagAction menuItem />
      {/if}
      <DeleteAssets
        menuItem
        onAssetDelete={(assetIds) => timelineManager.removeAssets(assetIds)}
        onUndoDelete={(assets) => timelineManager.addAssets(assets)}
      />
      <SetVisibilityAction menuItem onVisibilitySet={handleSetVisibility} />
      <hr />
      <AssetJobActions />
    </ButtonContextMenu>
  </AssetSelectControlBar>
{/if}
