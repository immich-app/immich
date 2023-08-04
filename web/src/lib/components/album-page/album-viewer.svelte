<script lang="ts">
  import { browser } from '$app/environment';
  import { afterNavigate, goto } from '$app/navigation';
  import { albumAssetSelectionStore } from '$lib/stores/album-asset-selection.store';
  import { dragAndDropFilesStore } from '$lib/stores/drag-and-drop-files.store';
  import { locale } from '$lib/stores/preferences.store';
  import { fileUploadHandler, openFileUploadDialog } from '$lib/utils/file-uploader';
  import {
    AlbumResponseDto,
    AssetResponseDto,
    SharedLinkResponseDto,
    SharedLinkType,
    UserResponseDto,
    api,
  } from '@api';
  import { onDestroy, onMount } from 'svelte';
  import ArrowLeft from 'svelte-material-icons/ArrowLeft.svelte';
  import DeleteOutline from 'svelte-material-icons/DeleteOutline.svelte';
  import DotsVertical from 'svelte-material-icons/DotsVertical.svelte';
  import FileImagePlusOutline from 'svelte-material-icons/FileImagePlusOutline.svelte';
  import FolderDownloadOutline from 'svelte-material-icons/FolderDownloadOutline.svelte';
  import Plus from 'svelte-material-icons/Plus.svelte';
  import ShareVariantOutline from 'svelte-material-icons/ShareVariantOutline.svelte';
  import Button from '../elements/buttons/button.svelte';
  import CircleIconButton from '../elements/buttons/circle-icon-button.svelte';
  import DownloadAction from '../photos-page/actions/download-action.svelte';
  import RemoveFromAlbum from '../photos-page/actions/remove-from-album.svelte';
  import AssetSelectControlBar from '../photos-page/asset-select-control-bar.svelte';
  import UserAvatar from '../shared-components/user-avatar.svelte';
  import ContextMenu from '../shared-components/context-menu/context-menu.svelte';
  import MenuOption from '../shared-components/context-menu/menu-option.svelte';
  import ControlAppBar from '../shared-components/control-app-bar.svelte';
  import CreateSharedLinkModal from '../shared-components/create-share-link-modal/create-shared-link-modal.svelte';
  import GalleryViewer from '../shared-components/gallery-viewer/gallery-viewer.svelte';
  import ImmichLogo from '../shared-components/immich-logo.svelte';
  import SelectAll from 'svelte-material-icons/SelectAll.svelte';
  import { NotificationType, notificationController } from '../shared-components/notification/notification';
  import ThemeButton from '../shared-components/theme-button.svelte';
  import AssetSelection from './asset-selection.svelte';
  import ShareInfoModal from './share-info-modal.svelte';
  import ThumbnailSelection from './thumbnail-selection.svelte';
  import UserSelectionModal from './user-selection-modal.svelte';
  import ConfirmDialogue from '$lib/components/shared-components/confirm-dialogue.svelte';
  import { handleError } from '../../utils/handle-error';
  import { downloadArchive } from '../../utils/asset-utils';
  import { assetViewingStore } from '$lib/stores/asset-viewing.store';

  export let album: AlbumResponseDto;
  export let sharedLink: SharedLinkResponseDto | undefined = undefined;

  const { isAlbumAssetSelectionOpen } = albumAssetSelectionStore;

  let { isViewing: showAssetViewer } = assetViewingStore;

  let isShowAssetSelection = false;

  let isShowShareLinkModal = false;

  $: $isAlbumAssetSelectionOpen = isShowAssetSelection;
  $: {
    if (browser) {
      if (isShowAssetSelection) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = 'auto';
      }
    }
  }
  let isShowShareUserSelection = false;
  let isEditingTitle = false;
  let isCreatingSharedAlbum = false;
  let isShowShareInfoModal = false;
  let isShowAlbumOptions = false;
  let isShowThumbnailSelection = false;
  let isShowDeleteConfirmation = false;

  let backUrl = '/albums';
  let currentAlbumName = '';
  let currentUser: UserResponseDto;
  let titleInput: HTMLInputElement;
  let contextMenuPosition = { x: 0, y: 0 };

  $: isPublicShared = sharedLink;
  $: isOwned = currentUser?.id == album.ownerId;

  dragAndDropFilesStore.subscribe((value) => {
    if (value.isDragging && value.files.length > 0) {
      fileUploadHandler(value.files, album.id, sharedLink?.key);
      dragAndDropFilesStore.set({ isDragging: false, files: [] });
    }
  });

  let multiSelectAsset: Set<AssetResponseDto> = new Set();
  $: isMultiSelectionMode = multiSelectAsset.size > 0;
  $: isMultiSelectionUserOwned = Array.from(multiSelectAsset).every((asset) => asset.ownerId === currentUser?.id);

  afterNavigate(({ from }) => {
    backUrl = from?.url.pathname ?? '/albums';

    if (from?.url.pathname === '/sharing' && album.sharedUsers.length === 0) {
      isCreatingSharedAlbum = true;
    }

    if (from?.route.id === '/(user)/search') {
      backUrl = from.url.href;
    }
  });

  const albumDateFormat: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  };

  const getDateRange = () => {
    const startDate = new Date(album.assets[0].fileCreatedAt);
    const endDate = new Date(album.assets[album.assetCount - 1].fileCreatedAt);

    const startDateString = startDate.toLocaleDateString($locale, albumDateFormat);
    const endDateString = endDate.toLocaleDateString($locale, albumDateFormat);

    // If the start and end date are the same, only show one date
    return startDateString === endDateString ? startDateString : `${startDateString} - ${endDateString}`;
  };

  const onKeyboardPress = (event: KeyboardEvent) => handleKeyboardPress(event);

  onMount(async () => {
    document.addEventListener('keydown', onKeyboardPress);
    currentAlbumName = album.albumName;

    try {
      const { data } = await api.userApi.getMyUserInfo();
      currentUser = data;
    } catch (e) {
      console.log('Error [getMyUserInfo - album-viewer] ', e);
    }
  });

  onDestroy(() => {
    if (browser) {
      document.removeEventListener('keydown', onKeyboardPress);
    }
  });

  const handleKeyboardPress = (event: KeyboardEvent) => {
    if (!$showAssetViewer) {
      switch (event.key) {
        case 'Escape':
          if (isMultiSelectionMode) {
            multiSelectAsset = new Set();
          } else {
            goto(backUrl);
          }
          return;
      }
    }
  };

  // Update Album Name
  $: {
    if (!isEditingTitle && currentAlbumName != album.albumName && isOwned) {
      api.albumApi
        .updateAlbumInfo({
          id: album.id,
          updateAlbumDto: {
            albumName: album.albumName,
          },
        })
        .then(() => {
          currentAlbumName = album.albumName;
        })
        .catch((e) => {
          console.error('Error [updateAlbumInfo] ', e);
          notificationController.show({
            type: NotificationType.Error,
            message: "Error updating album's name, check console for more details",
          });
        });
    }
  }

  const createAlbumHandler = async (event: CustomEvent) => {
    const { assets }: { assets: AssetResponseDto[] } = event.detail;
    try {
      const { data: results } = await api.albumApi.addAssetsToAlbum({
        id: album.id,
        bulkIdsDto: { ids: assets.map((a) => a.id) },
        key: sharedLink?.key,
      });

      const count = results.filter(({ success }) => success).length;
      notificationController.show({
        type: NotificationType.Info,
        message: `Added ${count} asset${count === 1 ? '' : 's'}`,
      });

      const { data } = await api.albumApi.getAlbumInfo({ id: album.id });
      album = data;

      isShowAssetSelection = false;
    } catch (e) {
      handleError(e, 'Error creating album');
    }
  };

  const addUserHandler = async (event: CustomEvent) => {
    const { selectedUsers }: { selectedUsers: UserResponseDto[] } = event.detail;

    try {
      const { data } = await api.albumApi.addUsersToAlbum({
        id: album.id,
        addUsersDto: {
          sharedUserIds: Array.from(selectedUsers).map((u) => u.id),
        },
      });

      album = data;

      isShowShareUserSelection = false;
    } catch (e) {
      console.error('Error [addUserHandler] ', e);
      notificationController.show({
        type: NotificationType.Error,
        message: 'Error adding users to album, check console for more details',
      });
    }
  };

  const sharedUserDeletedHandler = async (event: CustomEvent) => {
    const { userId }: { userId: string } = event.detail;

    if (userId == 'me') {
      isShowShareInfoModal = false;
      goto(backUrl);
      return;
    }

    try {
      const { data } = await api.albumApi.getAlbumInfo({ id: album.id });

      album = data;
      isShowShareInfoModal = data.sharedUsers.length >= 1;
    } catch (e) {
      handleError(e, 'Error deleting share users');
    }
  };

  const removeAlbum = async () => {
    try {
      await api.albumApi.deleteAlbum({ id: album.id });
      goto(backUrl);
    } catch (e) {
      console.error('Error [userDeleteMenu] ', e);
      notificationController.show({
        type: NotificationType.Error,
        message: 'Error deleting album, check console for more details',
      });
    } finally {
      isShowDeleteConfirmation = false;
    }
  };

  const downloadAlbum = async () => {
    await downloadArchive(`${album.albumName}.zip`, { albumId: album.id }, sharedLink?.key);
  };

  const showAlbumOptionsMenu = ({ x, y }: MouseEvent) => {
    contextMenuPosition = { x, y };
    isShowAlbumOptions = !isShowAlbumOptions;
  };

  const setAlbumThumbnailHandler = (event: CustomEvent) => {
    const { asset }: { asset: AssetResponseDto } = event.detail;
    try {
      api.albumApi.updateAlbumInfo({
        id: album.id,
        updateAlbumDto: {
          albumThumbnailAssetId: asset.id,
        },
      });
    } catch (e) {
      console.error('Error [setAlbumThumbnailHandler] ', e);
      notificationController.show({
        type: NotificationType.Error,
        message: 'Error setting album thumbnail, check console for more details',
      });
    }

    isShowThumbnailSelection = false;
  };

  const onSharedLinkClickHandler = () => {
    isShowShareUserSelection = false;
    isShowShareLinkModal = true;
  };

  const handleSelectAll = () => {
    multiSelectAsset = new Set(album.assets);
  };
</script>

<section class="bg-immich-bg dark:bg-immich-dark-bg" class:hidden={isShowThumbnailSelection}>
  <!-- Multiselection mode app bar -->
  {#if isMultiSelectionMode}
    <AssetSelectControlBar assets={multiSelectAsset} clearSelect={() => (multiSelectAsset = new Set())}>
      <CircleIconButton title="Select all" logo={SelectAll} on:click={handleSelectAll} />
      {#if sharedLink?.allowDownload || !isPublicShared}
        <DownloadAction filename="{album.albumName}.zip" sharedLinkKey={sharedLink?.key} />
      {/if}
      {#if isOwned || isMultiSelectionUserOwned}
        <RemoveFromAlbum bind:album />
      {/if}
    </AssetSelectControlBar>
  {/if}

  <!-- Default app bar -->
  {#if !isMultiSelectionMode}
    <ControlAppBar
      on:close-button-click={() => goto(backUrl)}
      backIcon={ArrowLeft}
      showBackButton={(!isPublicShared && isOwned) || (!isPublicShared && !isOwned) || (isPublicShared && isOwned)}
    >
      <svelte:fragment slot="leading">
        {#if isPublicShared && !isOwned}
          <a
            data-sveltekit-preload-data="hover"
            class="ml-6 flex place-items-center gap-2 hover:cursor-pointer"
            href="https://immich.app"
          >
            <ImmichLogo height={30} width={30} />
            <h1 class="font-immich-title text-lg text-immich-primary dark:text-immich-dark-primary">IMMICH</h1>
          </a>
        {/if}
      </svelte:fragment>

      <svelte:fragment slot="trailing">
        {#if !isCreatingSharedAlbum}
          {#if !sharedLink}
            <CircleIconButton
              title="Add Photos"
              on:click={() => (isShowAssetSelection = true)}
              logo={FileImagePlusOutline}
            />
          {:else if sharedLink?.allowUpload}
            <CircleIconButton
              title="Add Photos"
              on:click={() => openFileUploadDialog(album.id, sharedLink?.key)}
              logo={FileImagePlusOutline}
            />
          {/if}

          {#if isOwned}
            <CircleIconButton
              title="Share"
              on:click={() => (isShowShareUserSelection = true)}
              logo={ShareVariantOutline}
            />
            <CircleIconButton
              title="Remove album"
              on:click={() => (isShowDeleteConfirmation = true)}
              logo={DeleteOutline}
            />
          {/if}
        {/if}

        {#if album.assetCount > 0 && !isCreatingSharedAlbum}
          {#if !isPublicShared || (isPublicShared && sharedLink?.allowDownload)}
            <CircleIconButton title="Download" on:click={() => downloadAlbum()} logo={FolderDownloadOutline} />
          {/if}

          {#if !isPublicShared && isOwned}
            <CircleIconButton title="Album options" on:click={showAlbumOptionsMenu} logo={DotsVertical}>
              {#if isShowAlbumOptions}
                <ContextMenu {...contextMenuPosition} on:outclick={() => (isShowAlbumOptions = false)}>
                  <MenuOption
                    on:click={() => {
                      isShowThumbnailSelection = true;
                      isShowAlbumOptions = false;
                    }}
                    text="Set album cover"
                  />
                </ContextMenu>
              {/if}
            </CircleIconButton>
          {/if}
        {/if}

        {#if isPublicShared}
          <ThemeButton />
        {/if}

        {#if isCreatingSharedAlbum && album.sharedUsers.length == 0}
          <Button
            size="sm"
            rounded="lg"
            disabled={album.assetCount == 0}
            on:click={() => (isShowShareUserSelection = true)}
          >
            Share
          </Button>
        {/if}
      </svelte:fragment>
    </ControlAppBar>
  {/if}

  <section class="my-[160px] flex flex-col px-6 sm:px-12 md:px-24 lg:px-40">
    <input
      on:keydown={(e) => {
        if (e.key == 'Enter') {
          isEditingTitle = false;
          titleInput.blur();
        }
      }}
      on:focus={() => (isEditingTitle = true)}
      on:blur={() => (isEditingTitle = false)}
      class={`w-[99%] border-b-2 border-transparent text-6xl text-immich-primary outline-none transition-all dark:text-immich-dark-primary ${
        isOwned ? 'hover:border-gray-400' : 'hover:border-transparent'
      } bg-immich-bg focus:border-b-2 focus:border-immich-primary focus:outline-none dark:bg-immich-dark-bg dark:focus:border-immich-dark-primary dark:focus:bg-immich-dark-gray`}
      type="text"
      bind:value={album.albumName}
      disabled={!isOwned}
      bind:this={titleInput}
    />

    {#if album.assetCount > 0}
      <span class="my-4 flex gap-2 text-sm font-medium text-gray-500" data-testid="album-details">
        <p class="">{getDateRange()}</p>
        <p>·</p>
        <p>{album.assetCount} items</p>
      </span>
    {/if}
    {#if album.shared}
      <div class="my-6 flex gap-x-1">
        {#each album.sharedUsers as user (user.id)}
          <button on:click={() => (isShowShareInfoModal = true)}>
            <UserAvatar {user} size="md" autoColor />
          </button>
        {/each}

        <button
          style:display={isOwned ? 'block' : 'none'}
          on:click={() => (isShowShareUserSelection = true)}
          title="Add more users"
          class="flex h-12 w-12 place-content-center place-items-center rounded-full border bg-white text-3xl transition-colors hover:bg-gray-300"
          >+</button
        >
      </div>
    {/if}

    {#if album.assetCount > 0}
      <GalleryViewer assets={album.assets} {sharedLink} bind:selectedAssets={multiSelectAsset} />
    {:else}
      <!-- Album is empty - Show asset selectection buttons -->
      <section id="empty-album" class=" mt-[200px] flex place-content-center place-items-center">
        <div class="w-[300px]">
          <p class="text-xs dark:text-immich-dark-fg">ADD PHOTOS</p>
          <button
            on:click={() => (isShowAssetSelection = true)}
            class="mt-5 flex w-full place-items-center gap-6 rounded-md border bg-immich-bg px-8 py-8 text-immich-fg transition-all hover:bg-gray-100 hover:text-immich-primary dark:border-none dark:bg-immich-dark-gray dark:text-immich-dark-fg dark:hover:text-immich-dark-primary"
          >
            <span class="text-text-immich-primary dark:text-immich-dark-primary"><Plus size="24" /> </span>
            <span class="text-lg">Select photos</span>
          </button>
        </div>
      </section>
    {/if}
  </section>
</section>

{#if isShowAssetSelection}
  <AssetSelection
    albumId={album.id}
    assetsInAlbum={album.assets}
    on:go-back={() => (isShowAssetSelection = false)}
    on:create-album={createAlbumHandler}
  />
{/if}

{#if isShowShareUserSelection}
  <UserSelectionModal
    {album}
    on:close={() => (isShowShareUserSelection = false)}
    on:add-user={addUserHandler}
    on:sharedlinkclick={onSharedLinkClickHandler}
    sharedUsersInAlbum={new Set(album.sharedUsers)}
  />
{/if}

{#if isShowShareLinkModal}
  <CreateSharedLinkModal on:close={() => (isShowShareLinkModal = false)} shareType={SharedLinkType.Album} {album} />
{/if}
{#if isShowShareInfoModal}
  <ShareInfoModal on:close={() => (isShowShareInfoModal = false)} {album} on:user-deleted={sharedUserDeletedHandler} />
{/if}

{#if isShowThumbnailSelection}
  <ThumbnailSelection
    {album}
    on:close={() => (isShowThumbnailSelection = false)}
    on:thumbnail-selected={setAlbumThumbnailHandler}
  />
{/if}

{#if isShowDeleteConfirmation}
  <ConfirmDialogue
    title="Delete Album"
    confirmText="Delete"
    on:confirm={removeAlbum}
    on:cancel={() => (isShowDeleteConfirmation = false)}
  >
    <svelte:fragment slot="prompt">
      <p>Are you sure you want to delete the album <b>{album.albumName}</b>?</p>
      <p>If this album is shared, other users will not be able to access it anymore.</p>
    </svelte:fragment>
  </ConfirmDialogue>
{/if}
