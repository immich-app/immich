<script lang="ts">
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import AddToAlbum from '$lib/components/photos-page/actions/add-to-album.svelte';
  import ArchiveAction from '$lib/components/photos-page/actions/archive-action.svelte';
  import AssetJobActions from '$lib/components/photos-page/actions/asset-job-actions.svelte';
  import ChangeDate from '$lib/components/photos-page/actions/change-date-action.svelte';
  import ChangeLocation from '$lib/components/photos-page/actions/change-location-action.svelte';
  import CreateSharedLink from '$lib/components/photos-page/actions/create-shared-link.svelte';
  import DeleteAssets from '$lib/components/photos-page/actions/delete-assets.svelte';
  import DownloadAction from '$lib/components/photos-page/actions/download-action.svelte';
  import FavoriteAction from '$lib/components/photos-page/actions/favorite-action.svelte';
  import LinkLivePhotoAction from '$lib/components/photos-page/actions/link-live-photo-action.svelte';
  import SelectAllAssets from '$lib/components/photos-page/actions/select-all-assets.svelte';
  import StackAction from '$lib/components/photos-page/actions/stack-action.svelte';
  import TagAction from '$lib/components/photos-page/actions/tag-action.svelte';
  import AssetGrid from '$lib/components/photos-page/asset-grid.svelte';
  import AssetSelectControlBar from '$lib/components/photos-page/asset-select-control-bar.svelte';
  import MemoryLane from '$lib/components/photos-page/memory-lane.svelte';
  import ButtonContextMenu from '$lib/components/shared-components/context-menu/button-context-menu.svelte';
  import EmptyPlaceholder from '$lib/components/shared-components/empty-placeholder.svelte';
  import { AssetAction } from '$lib/constants';
  import { createAssetInteractionStore } from '$lib/stores/asset-interaction.store';
  import { assetViewingStore } from '$lib/stores/asset-viewing.store';
  import { AssetStore } from '$lib/stores/assets.store';
  import { preferences, user } from '$lib/stores/user.store';
  import type { OnLink, OnUnlink } from '$lib/utils/actions';
  import { openFileUploadDialog } from '$lib/utils/file-uploader';
  import { AssetTypeEnum } from '@immich/sdk';
  import { mdiDotsVertical, mdiPlus } from '@mdi/js';
  import { onDestroy } from 'svelte';
  import { t } from 'svelte-i18n';

  let { isViewing: showAssetViewer } = assetViewingStore;
  const assetStore = new AssetStore({ isArchived: false, withStacked: true, withPartners: true });
  const assetInteractionStore = createAssetInteractionStore();
  const { isMultiSelectState, selectedAssets } = assetInteractionStore;

  let isAllFavorite: boolean;
  let isAllOwned: boolean;
  let isAssetStackSelected: boolean;
  let isLinkActionAvailable: boolean;

  $: {
    const selection = [...$selectedAssets];
    isAllOwned = selection.every((asset) => asset.ownerId === $user.id);
    isAllFavorite = selection.every((asset) => asset.isFavorite);
    isAssetStackSelected = selection.length === 1 && !!selection[0].stack;
    const isLivePhoto = selection.length === 1 && !!selection[0].livePhotoVideoId;
    const isLivePhotoCandidate =
      selection.length === 2 &&
      selection.some((asset) => asset.type === AssetTypeEnum.Image) &&
      selection.some((asset) => asset.type === AssetTypeEnum.Image);
    isLinkActionAvailable = isAllOwned && (isLivePhoto || isLivePhotoCandidate);
  }

  const handleEscape = () => {
    if ($showAssetViewer) {
      return;
    }
    if ($isMultiSelectState) {
      assetInteractionStore.clearMultiselect();
      return;
    }
  };

  const handleLink: OnLink = ({ still, motion }) => {
    assetStore.removeAssets([motion.id]);
    assetStore.updateAssets([still]);
  };

  const handleUnlink: OnUnlink = ({ still, motion }) => {
    assetStore.addAssets([motion]);
    assetStore.updateAssets([still]);
  };

  onDestroy(() => {
    assetStore.destroy();
  });
</script>

{#if $isMultiSelectState}
  <AssetSelectControlBar
    ownerId={$user.id}
    assets={$selectedAssets}
    clearSelect={() => assetInteractionStore.clearMultiselect()}
  >
    <CreateSharedLink />
    <SelectAllAssets {assetStore} {assetInteractionStore} />
    <ButtonContextMenu icon={mdiPlus} title={$t('add_to')}>
      <AddToAlbum />
      <AddToAlbum shared />
    </ButtonContextMenu>
    <FavoriteAction removeFavorite={isAllFavorite} onFavorite={() => assetStore.triggerUpdate()} />
    <ButtonContextMenu icon={mdiDotsVertical} title={$t('menu')}>
      <DownloadAction menuItem />
      {#if $selectedAssets.size > 1 || isAssetStackSelected}
        <StackAction
          unstack={isAssetStackSelected}
          onStack={(assetIds) => assetStore.removeAssets(assetIds)}
          onUnstack={(assets) => assetStore.addAssets(assets)}
        />
      {/if}
      {#if isLinkActionAvailable}
        <LinkLivePhotoAction
          menuItem
          unlink={[...$selectedAssets].length === 1}
          onLink={handleLink}
          onUnlink={handleUnlink}
        />
      {/if}
      <ChangeDate menuItem />
      <ChangeLocation menuItem />
      <ArchiveAction menuItem onArchive={(assetIds) => assetStore.removeAssets(assetIds)} />
      {#if $preferences.tags.enabled}
        <TagAction menuItem />
      {/if}
      <DeleteAssets menuItem onAssetDelete={(assetIds) => assetStore.removeAssets(assetIds)} />
      <hr />
      <AssetJobActions />
    </ButtonContextMenu>
  </AssetSelectControlBar>
{/if}

<UserPageLayout hideNavbar={$isMultiSelectState} showUploadButton scrollbar={false}>
  <AssetGrid
    enableRouting={true}
    {assetStore}
    {assetInteractionStore}
    removeAction={AssetAction.ARCHIVE}
    onEscape={handleEscape}
    withStacked
  >
    {#if $preferences.memories.enabled}
      <MemoryLane />
    {/if}
    <EmptyPlaceholder text={$t('no_assets_message')} onClick={() => openFileUploadDialog()} slot="empty" />
  </AssetGrid>
</UserPageLayout>
