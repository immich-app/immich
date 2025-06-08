<script lang="ts">
  import { beforeNavigate } from '$app/navigation';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import AddToAlbum from '$lib/components/photos-page/actions/add-to-album.svelte';
  import ArchiveAction from '$lib/components/photos-page/actions/archive-action.svelte';
  import AssetJobActions from '$lib/components/photos-page/actions/asset-job-actions.svelte';
  import ChangeDate from '$lib/components/photos-page/actions/change-date-action.svelte';
  import ChangeDescription from '$lib/components/photos-page/actions/change-description-action.svelte';
  import ChangeLocation from '$lib/components/photos-page/actions/change-location-action.svelte';
  import CreateSharedLink from '$lib/components/photos-page/actions/create-shared-link.svelte';
  import DeleteAssets from '$lib/components/photos-page/actions/delete-assets.svelte';
  import DownloadAction from '$lib/components/photos-page/actions/download-action.svelte';
  import FavoriteAction from '$lib/components/photos-page/actions/favorite-action.svelte';
  import LinkLivePhotoAction from '$lib/components/photos-page/actions/link-live-photo-action.svelte';
  import SelectAllAssets from '$lib/components/photos-page/actions/select-all-assets.svelte';
  import SetVisibilityAction from '$lib/components/photos-page/actions/set-visibility-action.svelte';
  import StackAction from '$lib/components/photos-page/actions/stack-action.svelte';
  import TagAction from '$lib/components/photos-page/actions/tag-action.svelte';
  import AssetGrid from '$lib/components/photos-page/asset-grid.svelte';
  import AssetSelectControlBar from '$lib/components/photos-page/asset-select-control-bar.svelte';
  import MemoryLane from '$lib/components/photos-page/memory-lane.svelte';
  import ButtonContextMenu from '$lib/components/shared-components/context-menu/button-context-menu.svelte';
  import EmptyPlaceholder from '$lib/components/shared-components/empty-placeholder.svelte';
  import { AssetAction } from '$lib/constants';
  import { TimelineManager } from '$lib/managers/timeline-manager/timeline-manager.svelte';
  import { AssetInteraction } from '$lib/stores/asset-interaction.svelte';
  import { assetViewingStore } from '$lib/stores/asset-viewing.store';
  import { isFaceEditMode } from '$lib/stores/face-edit.svelte';
  import { preferences, user } from '$lib/stores/user.store';
  import {
    updateStackedAssetInTimeline,
    updateUnstackedAssetInTimeline,
    type OnLink,
    type OnUnlink,
  } from '$lib/utils/actions';
  import { openFileUploadDialog } from '$lib/utils/file-uploader';
  import { AssetVisibility } from '@immich/sdk';

  import { mdiDotsVertical, mdiPlus } from '@mdi/js';
  import { onDestroy } from 'svelte';
  import { t } from 'svelte-i18n';

  let { isViewing: showAssetViewer } = assetViewingStore;
  const timelineManager = new TimelineManager();
  void timelineManager.updateOptions({ visibility: AssetVisibility.Timeline, withStacked: true, withPartners: true });
  onDestroy(() => timelineManager.destroy());

  const assetInteraction = new AssetInteraction();

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
  <AssetGrid
    enableRouting={true}
    {timelineManager}
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
  </AssetGrid>
</UserPageLayout>

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
