<script lang="ts">
  import { goto } from '$app/navigation';
  import CastButton from '$lib/cast/cast-button.svelte';
  import type { OnAction, PreAction } from '$lib/components/asset-viewer/actions/action';
  import AddToAlbumAction from '$lib/components/asset-viewer/actions/add-to-album-action.svelte';
  import ArchiveAction from '$lib/components/asset-viewer/actions/archive-action.svelte';
  import CloseAction from '$lib/components/asset-viewer/actions/close-action.svelte';
  import DeleteAction from '$lib/components/asset-viewer/actions/delete-action.svelte';
  import DownloadAction from '$lib/components/asset-viewer/actions/download-action.svelte';
  import FavoriteAction from '$lib/components/asset-viewer/actions/favorite-action.svelte';
  import KeepThisDeleteOthersAction from '$lib/components/asset-viewer/actions/keep-this-delete-others.svelte';
  import RemoveAssetFromStack from '$lib/components/asset-viewer/actions/remove-asset-from-stack.svelte';
  import RestoreAction from '$lib/components/asset-viewer/actions/restore-action.svelte';
  import SetAlbumCoverAction from '$lib/components/asset-viewer/actions/set-album-cover-action.svelte';
  import SetFeaturedPhotoAction from '$lib/components/asset-viewer/actions/set-person-featured-action.svelte';
  import SetProfilePictureAction from '$lib/components/asset-viewer/actions/set-profile-picture-action.svelte';
  import SetStackPrimaryAsset from '$lib/components/asset-viewer/actions/set-stack-primary-asset.svelte';
  import SetVisibilityAction from '$lib/components/asset-viewer/actions/set-visibility-action.svelte';
  import ShareAction from '$lib/components/asset-viewer/actions/share-action.svelte';
  import ShowDetailAction from '$lib/components/asset-viewer/actions/show-detail-action.svelte';
  import UnstackAction from '$lib/components/asset-viewer/actions/unstack-action.svelte';
  import ButtonContextMenu from '$lib/components/shared-components/context-menu/button-context-menu.svelte';
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import { AppRoute } from '$lib/constants';
  import { featureFlags } from '$lib/stores/server-config.store';
  import { user } from '$lib/stores/user.store';
  import { photoZoomState } from '$lib/stores/zoom-image.store';
  import { getAssetJobName, getSharedLink } from '$lib/utils';
  import { canCopyImageToClipboard } from '$lib/utils/asset-utils';
  import { openFileUploadDialog } from '$lib/utils/file-uploader';
  import { toTimelineAsset } from '$lib/utils/timeline-util';
  import {
    AssetJobName,
    AssetTypeEnum,
    AssetVisibility,
    type AlbumResponseDto,
    type AssetResponseDto,
    type PersonResponseDto,
    type StackResponseDto,
  } from '@immich/sdk';
  import { IconButton } from '@immich/ui';
  import {
    mdiAlertOutline,
    mdiCogRefreshOutline,
    mdiCompare,
    mdiContentCopy,
    mdiDatabaseRefreshOutline,
    mdiDotsVertical,
    mdiHeadSyncOutline,
    mdiImageRefreshOutline,
    mdiImageSearch,
    mdiMagnifyMinusOutline,
    mdiMagnifyPlusOutline,
    mdiPresentationPlay,
    mdiUpload,
  } from '@mdi/js';
  import type { Snippet } from 'svelte';
  import { t } from 'svelte-i18n';

  interface Props {
    asset: AssetResponseDto;
    album?: AlbumResponseDto | null;
    person?: PersonResponseDto | null;
    stack?: StackResponseDto | null;
    showCloseButton?: boolean;
    showDetailButton: boolean;
    showSlideshow?: boolean;
    onZoomImage: () => void;
    onCopyImage?: () => Promise<void>;
    preAction: PreAction;
    onAction: OnAction;
    onRunJob: (name: AssetJobName) => void;
    onPlaySlideshow: () => void;
    onShowDetail: () => void;
    // export let showEditorHandler: () => void;
    onClose: () => void;
    motionPhoto?: Snippet;
  }

  let {
    asset,
    album = null,
    person = null,
    stack = null,
    showCloseButton = true,
    showDetailButton,
    showSlideshow = false,
    onZoomImage,
    onCopyImage,
    preAction,
    onAction,
    onRunJob,
    onPlaySlideshow,
    onShowDetail,
    onClose,
    motionPhoto,
  }: Props = $props();

  const sharedLink = getSharedLink();
  let isOwner = $derived($user && asset.ownerId === $user?.id);
  let showDownloadButton = $derived(sharedLink ? sharedLink.allowDownload : !asset.isOffline);
  let isLocked = $derived(asset.visibility === AssetVisibility.Locked);
  let smartSearchEnabled = $derived($featureFlags.loaded && $featureFlags.smartSearch);

  // $: showEditorButton =
  //   isOwner &&
  //   asset.type === AssetTypeEnum.Image &&
  //   !(
  //     asset.exifInfo?.projectionType === ProjectionType.EQUIRECTANGULAR ||
  //     (asset.originalPath && asset.originalPath.toLowerCase().endsWith('.insp'))
  //   ) &&
  //   !(asset.originalPath && asset.originalPath.toLowerCase().endsWith('.gif')) &&
  //   !asset.livePhotoVideoId;
</script>

<div
  class="flex h-16 place-items-center justify-between bg-linear-to-b from-black/40 px-3 transition-transform duration-200"
>
  <div class="dark">
    {#if showCloseButton}
      <CloseAction {onClose} />
    {/if}
  </div>
  <div class="flex gap-2 overflow-x-auto dark" data-testid="asset-viewer-navbar-actions">
    <CastButton />

    {#if !asset.isTrashed && $user && !isLocked}
      <ShareAction {asset} />
    {/if}
    {#if asset.isOffline}
      <IconButton
        shape="round"
        color="danger"
        icon={mdiAlertOutline}
        onclick={onShowDetail}
        aria-label={$t('asset_offline')}
      />
    {/if}
    {#if asset.livePhotoVideoId}
      {@render motionPhoto?.()}
    {/if}
    {#if asset.type === AssetTypeEnum.Image}
      <IconButton
        class="hidden sm:flex"
        color="secondary"
        variant="ghost"
        shape="round"
        icon={$photoZoomState && $photoZoomState.currentZoom > 1 ? mdiMagnifyMinusOutline : mdiMagnifyPlusOutline}
        aria-label={$t('zoom_image')}
        onclick={onZoomImage}
      />
    {/if}
    {#if canCopyImageToClipboard() && asset.type === AssetTypeEnum.Image}
      <IconButton
        color="secondary"
        variant="ghost"
        shape="round"
        icon={mdiContentCopy}
        aria-label={$t('copy_image')}
        onclick={() => onCopyImage?.()}
      />
    {/if}

    {#if !isOwner && showDownloadButton}
      <DownloadAction asset={toTimelineAsset(asset)} />
    {/if}

    {#if showDetailButton}
      <ShowDetailAction {onShowDetail} />
    {/if}

    {#if isOwner}
      <FavoriteAction {asset} {onAction} />
    {/if}

    {#if isOwner}
      <DeleteAction {asset} {onAction} {preAction} />

      <ButtonContextMenu direction="left" align="top-right" color="secondary" title={$t('more')} icon={mdiDotsVertical}>
        {#if showSlideshow && !isLocked}
          <MenuOption icon={mdiPresentationPlay} text={$t('slideshow')} onClick={onPlaySlideshow} />
        {/if}
        {#if showDownloadButton}
          <DownloadAction asset={toTimelineAsset(asset)} menuItem />
        {/if}

        {#if !isLocked}
          {#if asset.isTrashed}
            <RestoreAction {asset} {onAction} />
          {:else}
            <AddToAlbumAction {asset} {onAction} />
            <AddToAlbumAction {asset} {onAction} shared />
          {/if}
        {/if}

        {#if isOwner}
          {#if stack}
            <UnstackAction {stack} {onAction} />
            <KeepThisDeleteOthersAction {stack} {asset} {onAction} />
            {#if stack?.primaryAssetId !== asset.id}
              <SetStackPrimaryAsset {stack} {asset} {onAction} />
              {#if stack?.assets?.length > 2}
                <RemoveAssetFromStack {asset} {stack} {onAction} />
              {/if}
            {/if}
          {/if}
          {#if album}
            <SetAlbumCoverAction {asset} {album} />
          {/if}
          {#if person}
            <SetFeaturedPhotoAction {asset} {person} {onAction} />
          {/if}
          {#if asset.type === AssetTypeEnum.Image && !isLocked}
            <SetProfilePictureAction {asset} />
          {/if}

          {#if !isLocked}
            <ArchiveAction {asset} {onAction} {preAction} />
            <MenuOption
              icon={mdiUpload}
              onClick={() => openFileUploadDialog({ multiple: false, assetId: asset.id })}
              text={$t('replace_with_upload')}
            />
            {#if !asset.isArchived && !asset.isTrashed}
              <MenuOption
                icon={mdiImageSearch}
                onClick={() => goto(`${AppRoute.PHOTOS}?at=${stack?.primaryAssetId ?? asset.id}`)}
                text={$t('view_in_timeline')}
              />
            {/if}
            {#if !asset.isArchived && !asset.isTrashed && smartSearchEnabled}
              <MenuOption
                icon={mdiCompare}
                onClick={() => goto(`${AppRoute.SEARCH}?query={"queryAssetId":"${stack?.primaryAssetId ?? asset.id}"}`)}
                text={$t('view_similar_photos')}
              />
            {/if}
          {/if}

          {#if !asset.isTrashed}
            <SetVisibilityAction asset={toTimelineAsset(asset)} {onAction} {preAction} />
          {/if}
          <hr />
          <MenuOption
            icon={mdiHeadSyncOutline}
            onClick={() => onRunJob(AssetJobName.RefreshFaces)}
            text={$getAssetJobName(AssetJobName.RefreshFaces)}
          />
          <MenuOption
            icon={mdiDatabaseRefreshOutline}
            onClick={() => onRunJob(AssetJobName.RefreshMetadata)}
            text={$getAssetJobName(AssetJobName.RefreshMetadata)}
          />
          <MenuOption
            icon={mdiImageRefreshOutline}
            onClick={() => onRunJob(AssetJobName.RegenerateThumbnail)}
            text={$getAssetJobName(AssetJobName.RegenerateThumbnail)}
          />
          {#if asset.type === AssetTypeEnum.Video}
            <MenuOption
              icon={mdiCogRefreshOutline}
              onClick={() => onRunJob(AssetJobName.TranscodeVideo)}
              text={$getAssetJobName(AssetJobName.TranscodeVideo)}
            />
          {/if}
        {/if}
      </ButtonContextMenu>
    {/if}
  </div>
</div>
