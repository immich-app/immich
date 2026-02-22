<script lang="ts">
  import { goto } from '$app/navigation';
  import ActionMenuItem from '$lib/components/ActionMenuItem.svelte';
  import type { OnAction, PreAction } from '$lib/components/asset-viewer/actions/action';
  import AddToStackAction from '$lib/components/asset-viewer/actions/add-to-stack-action.svelte';
  import ArchiveAction from '$lib/components/asset-viewer/actions/archive-action.svelte';
  import DeleteAction from '$lib/components/asset-viewer/actions/delete-action.svelte';
  import KeepThisDeleteOthersAction from '$lib/components/asset-viewer/actions/keep-this-delete-others.svelte';
  import RatingAction from '$lib/components/asset-viewer/actions/rating-action.svelte';
  import RemoveAssetFromStack from '$lib/components/asset-viewer/actions/remove-asset-from-stack.svelte';
  import RestoreAction from '$lib/components/asset-viewer/actions/restore-action.svelte';
  import SetAlbumCoverAction from '$lib/components/asset-viewer/actions/set-album-cover-action.svelte';
  import SetFeaturedPhotoAction from '$lib/components/asset-viewer/actions/set-person-featured-action.svelte';
  import SetProfilePictureAction from '$lib/components/asset-viewer/actions/set-profile-picture-action.svelte';
  import SetStackPrimaryAsset from '$lib/components/asset-viewer/actions/set-stack-primary-asset.svelte';
  import SetVisibilityAction from '$lib/components/asset-viewer/actions/set-visibility-action.svelte';
  import UnstackAction from '$lib/components/asset-viewer/actions/unstack-action.svelte';
  import ButtonContextMenu from '$lib/components/shared-components/context-menu/button-context-menu.svelte';
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import { featureFlagsManager } from '$lib/managers/feature-flags-manager.svelte';
  import { Route } from '$lib/route';
  import { getGlobalActions } from '$lib/services/app.service';
  import { getAssetActions, handleReplaceAsset } from '$lib/services/asset.service';
  import { user } from '$lib/stores/user.store';
  import { getSharedLink, withoutIcons } from '$lib/utils';
  import type { OnUndoDelete } from '$lib/utils/actions';
  import { toTimelineAsset } from '$lib/utils/timeline-util';
  import {
    AssetTypeEnum,
    AssetVisibility,
    type AlbumResponseDto,
    type AssetResponseDto,
    type PersonResponseDto,
    type StackResponseDto,
  } from '@immich/sdk';
  import { ActionButton, CommandPaletteDefaultProvider, type ActionItem } from '@immich/ui';
  import {
    mdiArrowLeft,
    mdiCompare,
    mdiDotsVertical,
    mdiImageSearch,
    mdiPresentationPlay,
    mdiUpload,
    mdiVideoOutline,
  } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    asset: AssetResponseDto;
    album?: AlbumResponseDto | null;
    person?: PersonResponseDto | null;
    stack?: StackResponseDto | null;
    showSlideshow?: boolean;
    preAction: PreAction;
    onAction: OnAction;
    onUndoDelete?: OnUndoDelete;
    onPlaySlideshow: () => void;
    onClose?: () => void;
    playOriginalVideo: boolean;
    setPlayOriginalVideo: (value: boolean) => void;
  }

  let {
    asset,
    album = null,
    person = null,
    stack = null,
    showSlideshow = false,
    preAction,
    onAction,
    onUndoDelete = undefined,
    onPlaySlideshow,
    onClose,
    playOriginalVideo = false,
    setPlayOriginalVideo,
  }: Props = $props();

  const isOwner = $derived($user && asset.ownerId === $user?.id);
  const isLocked = $derived(asset.visibility === AssetVisibility.Locked);
  const smartSearchEnabled = $derived(featureFlagsManager.value.smartSearch);

  const { Cast } = $derived(getGlobalActions($t));

  const Close: ActionItem = $derived({
    title: $t('go_back'),
    type: $t('assets'),
    icon: mdiArrowLeft,
    $if: () => !!onClose,
    onAction: () => onClose?.(),
    shortcuts: [{ key: 'Escape' }],
  });

  const Actions = $derived(getAssetActions($t, asset));
  const sharedLink = getSharedLink();
</script>

<CommandPaletteDefaultProvider name={$t('assets')} actions={withoutIcons([Close, Cast, ...Object.values(Actions)])} />

<div
  class="flex h-16 place-items-center justify-between bg-linear-to-b from-black/40 px-3 transition-transform duration-200"
>
  <div class="dark">
    <ActionButton action={Close} />
  </div>

  <div class="flex gap-2 overflow-x-auto dark" data-testid="asset-viewer-navbar-actions">
    <ActionButton action={Cast} />
    <ActionButton action={Actions.Share} />
    <ActionButton action={Actions.Offline} />
    <ActionButton action={Actions.PlayMotionPhoto} />
    <ActionButton action={Actions.StopMotionPhoto} />
    <ActionButton action={Actions.ZoomIn} />
    <ActionButton action={Actions.ZoomOut} />
    <ActionButton action={Actions.Copy} />
    <ActionButton action={Actions.SharedLinkDownload} />
    <ActionButton action={Actions.Info} />
    <ActionButton action={Actions.Favorite} />
    <ActionButton action={Actions.Unfavorite} />

    {#if isOwner}
      <RatingAction {asset} {onAction} />
    {/if}

    <ActionButton action={Actions.Edit} />

    {#if isOwner}
      <DeleteAction {asset} {onAction} {preAction} {onUndoDelete} />
    {/if}

    {#if !sharedLink}
      <ButtonContextMenu direction="left" align="top-right" color="secondary" title={$t('more')} icon={mdiDotsVertical}>
        {#if showSlideshow && !isLocked}
          <MenuOption icon={mdiPresentationPlay} text={$t('slideshow')} onClick={onPlaySlideshow} />
        {/if}

        <ActionMenuItem action={Actions.Download} />
        <ActionMenuItem action={Actions.DownloadOriginal} />

        {#if !isLocked && asset.isTrashed}
          <RestoreAction {asset} {onAction} />
        {/if}

        <ActionMenuItem action={Actions.AddToAlbum} />

        {#if isOwner}
          <AddToStackAction {asset} {stack} {onAction} />
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
          {#if isOwner}
            <ArchiveAction {asset} {onAction} {preAction} />
            <MenuOption
              icon={mdiUpload}
              onClick={() => handleReplaceAsset(asset.id)}
              text={$t('replace_with_upload')}
            />
            {#if !asset.isArchived && !asset.isTrashed}
              <MenuOption
                icon={mdiImageSearch}
                onClick={() => goto(Route.photos({ at: stack?.primaryAssetId ?? asset.id }))}
                text={$t('view_in_timeline')}
              />
            {/if}
          {/if}
          {#if !asset.isArchived && !asset.isTrashed && smartSearchEnabled}
            <MenuOption
              icon={mdiCompare}
              onClick={() => goto(Route.search({ queryAssetId: stack?.primaryAssetId ?? asset.id }))}
              text={$t('view_similar_photos')}
            />
          {/if}
        {/if}

        {#if !asset.isTrashed && isOwner}
          <SetVisibilityAction asset={toTimelineAsset(asset)} {onAction} {preAction} />
        {/if}

        {#if asset.type === AssetTypeEnum.Video}
          <MenuOption
            icon={mdiVideoOutline}
            onClick={() => setPlayOriginalVideo(!playOriginalVideo)}
            text={playOriginalVideo ? $t('play_transcoded_video') : $t('play_original_video')}
          />
        {/if}
        {#if isOwner}
          <hr />
          <ActionMenuItem action={Actions.RefreshFacesJob} />
          <ActionMenuItem action={Actions.RefreshMetadataJob} />
          <ActionMenuItem action={Actions.RegenerateThumbnailJob} />
          <ActionMenuItem action={Actions.TranscodeVideoJob} />
        {/if}
      </ButtonContextMenu>
    {/if}
  </div>
</div>
