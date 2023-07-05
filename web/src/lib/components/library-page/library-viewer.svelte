<script lang="ts">
  import { browser } from '$app/environment';
  import { afterNavigate, goto } from '$app/navigation';
  import { libraryAssetSelectionStore } from '$lib/stores/library-asset-selection.store';
  import { dragAndDropFilesStore } from '$lib/stores/drag-and-drop-files.store';
  import { locale } from '$lib/stores/preferences.store';
  import { fileUploadHandler, openFileUploadDialog } from '$lib/utils/file-uploader';
  import {
    LibraryResponseDto,
    AssetResponseDto,
    SharedLinkResponseDto,
    SharedLinkType,
    UserResponseDto,
    api,
  } from '@api';
  import { onMount } from 'svelte';
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
  import RemoveFromLibrary from '../photos-page/actions/remove-from-library.svelte';
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

  export let library: LibraryResponseDto;
  export let sharedLink: SharedLinkResponseDto | undefined = undefined;

  const { isLibraryAssetSelectionOpen } = libraryAssetSelectionStore;

  let isShowAssetSelection = false;

  let isShowShareLinkModal = false;

  $: $isLibraryAssetSelectionOpen = isShowAssetSelection;
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
  let isCreatingSharedLibrary = false;
  let isShowShareInfoModal = false;
  let isShowLibraryOptions = false;
  let isShowThumbnailSelection = false;
  let isShowDeleteConfirmation = false;

  let backUrl = '/librarys';
  let currentLibraryName = '';
  let currentUser: UserResponseDto;
  let titleInput: HTMLInputElement;
  let contextMenuPosition = { x: 0, y: 0 };

  $: isPublicShared = sharedLink;
  $: isOwned = currentUser?.id == library.ownerId;

  dragAndDropFilesStore.subscribe((value) => {
    if (value.isDragging && value.files.length > 0) {
      fileUploadHandler(value.files, library.id, sharedLink?.key);
      dragAndDropFilesStore.set({ isDragging: false, files: [] });
    }
  });

  let multiSelectAsset: Set<AssetResponseDto> = new Set();
  $: isMultiSelectionMode = multiSelectAsset.size > 0;

  afterNavigate(({ from }) => {
    backUrl = from?.url.pathname ?? '/librarys';

    if (from?.url.pathname === '/sharing' && library.sharedUsers.length === 0) {
      isCreatingSharedLibrary = true;
    }

    if (from?.route.id === '/(user)/search') {
      backUrl = from.url.href;
    }
  });

  const libraryDateFormat: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  };

  const getDateRange = () => {
    const startDate = new Date(library.assets[0].fileCreatedAt);
    const endDate = new Date(library.assets[library.assetCount - 1].fileCreatedAt);

    const startDateString = startDate.toLocaleDateString($locale, libraryDateFormat);
    const endDateString = endDate.toLocaleDateString($locale, libraryDateFormat);

    // If the start and end date are the same, only show one date
    return startDateString === endDateString ? startDateString : `${startDateString} - ${endDateString}`;
  };

  onMount(async () => {
    currentLibraryName = library.libraryName;

    try {
      const { data } = await api.userApi.getMyUserInfo();
      currentUser = data;
    } catch (e) {
      console.log('Error [getMyUserInfo - library-viewer] ', e);
    }
  });

  // Update Library Name
  $: {
    if (!isEditingTitle && currentLibraryName != library.libraryName && isOwned) {
      api.libraryApi
        .updateLibraryInfo({
          id: library.id,
          updateLibraryDto: {
            libraryName: library.libraryName,
          },
        })
        .then(() => {
          currentLibraryName = library.libraryName;
        })
        .catch((e) => {
          console.error('Error [updateLibraryInfo] ', e);
          notificationController.show({
            type: NotificationType.Error,
            message: "Error updating library's name, check console for more details",
          });
        });
    }
  }

  const createLibraryHandler = async (event: CustomEvent) => {
    const { assets }: { assets: AssetResponseDto[] } = event.detail;
    try {
      const { data } = await api.libraryApi.addAssetsToLibrary({
        id: library.id,
        addAssetsDto: {
          assetIds: assets.map((a) => a.id),
        },
        key: sharedLink?.key,
      });

      if (data.library) {
        library = data.library;
      }
      isShowAssetSelection = false;
    } catch (e) {
      console.error('Error [createLibraryHandler] ', e);
      notificationController.show({
        type: NotificationType.Error,
        message: 'Error creating library, check console for more details',
      });
    }
  };

  const addUserHandler = async (event: CustomEvent) => {
    const { selectedUsers }: { selectedUsers: UserResponseDto[] } = event.detail;

    try {
      const { data } = await api.libraryApi.addUsersToLibrary({
        id: library.id,
        addUsersDto: {
          sharedUserIds: Array.from(selectedUsers).map((u) => u.id),
        },
      });

      library = data;

      isShowShareUserSelection = false;
    } catch (e) {
      console.error('Error [addUserHandler] ', e);
      notificationController.show({
        type: NotificationType.Error,
        message: 'Error adding users to library, check console for more details',
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
      const { data } = await api.libraryApi.getLibraryInfo({ id: library.id });

      library = data;
      isShowShareInfoModal = data.sharedUsers.length >= 1;
    } catch (e) {
      handleError(e, 'Error deleting share users');
    }
  };

  const removeLibrary = async () => {
    try {
      await api.libraryApi.deleteLibrary({ id: library.id });
      goto(backUrl);
    } catch (e) {
      console.error('Error [userDeleteMenu] ', e);
      notificationController.show({
        type: NotificationType.Error,
        message: 'Error deleting library, check console for more details',
      });
    } finally {
      isShowDeleteConfirmation = false;
    }
  };

  const downloadLibrary = async () => {
    await downloadArchive(`${library.libraryName}.zip`, { libraryId: library.id }, undefined, sharedLink?.key);
  };

  const showLibraryOptionsMenu = ({ x, y }: MouseEvent) => {
    contextMenuPosition = { x, y };
    isShowLibraryOptions = !isShowLibraryOptions;
  };

  const setLibraryThumbnailHandler = (event: CustomEvent) => {
    const { asset }: { asset: AssetResponseDto } = event.detail;
    try {
      api.libraryApi.updateLibraryInfo({
        id: library.id,
        updateLibraryDto: {
          libraryThumbnailAssetId: asset.id,
        },
      });
    } catch (e) {
      console.error('Error [setLibraryThumbnailHandler] ', e);
      notificationController.show({
        type: NotificationType.Error,
        message: 'Error setting library thumbnail, check console for more details',
      });
    }

    isShowThumbnailSelection = false;
  };

  const onSharedLinkClickHandler = () => {
    isShowShareUserSelection = false;
    isShowShareLinkModal = true;
  };

  const handleSelectAll = () => {
    multiSelectAsset = new Set(library.assets);
  };
</script>

<section class="bg-immich-bg dark:bg-immich-dark-bg" class:hidden={isShowThumbnailSelection}>
  <!-- Multiselection mode app bar -->
  {#if isMultiSelectionMode}
    <AssetSelectControlBar assets={multiSelectAsset} clearSelect={() => (multiSelectAsset = new Set())}>
      <CircleIconButton title="Select all" logo={SelectAll} on:click={handleSelectAll} />
      {#if sharedLink?.allowDownload || !isPublicShared}
        <DownloadAction filename="{library.libraryName}.zip" sharedLinkKey={sharedLink?.key} />
      {/if}
      {#if isOwned}
        <RemoveFromLibrary bind:library />
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
            class="flex gap-2 place-items-center hover:cursor-pointer ml-6"
            href="https://immich.app"
          >
            <ImmichLogo height={30} width={30} />
            <h1 class="font-immich-title text-lg text-immich-primary dark:text-immich-dark-primary">IMMICH</h1>
          </a>
        {/if}
      </svelte:fragment>

      <svelte:fragment slot="trailing">
        {#if !isCreatingSharedLibrary}
          {#if !sharedLink}
            <CircleIconButton
              title="Add Photos"
              on:click={() => (isShowAssetSelection = true)}
              logo={FileImagePlusOutline}
            />
          {:else if sharedLink?.allowUpload}
            <CircleIconButton
              title="Add Photos"
              on:click={() => openFileUploadDialog(library.id, sharedLink?.key)}
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
              title="Remove library"
              on:click={() => (isShowDeleteConfirmation = true)}
              logo={DeleteOutline}
            />
          {/if}
        {/if}

        {#if library.assetCount > 0 && !isCreatingSharedLibrary}
          {#if !isPublicShared || (isPublicShared && sharedLink?.allowDownload)}
            <CircleIconButton title="Download" on:click={() => downloadLibrary()} logo={FolderDownloadOutline} />
          {/if}

          {#if !isPublicShared && isOwned}
            <CircleIconButton title="Library options" on:click={showLibraryOptionsMenu} logo={DotsVertical}>
              {#if isShowLibraryOptions}
                <ContextMenu {...contextMenuPosition} on:outclick={() => (isShowLibraryOptions = false)}>
                  <MenuOption
                    on:click={() => {
                      isShowThumbnailSelection = true;
                      isShowLibraryOptions = false;
                    }}
                    text="Set library cover"
                  />
                </ContextMenu>
              {/if}
            </CircleIconButton>
          {/if}
        {/if}

        {#if isPublicShared}
          <ThemeButton />
        {/if}

        {#if isCreatingSharedLibrary && library.sharedUsers.length == 0}
          <Button
            size="sm"
            rounded="lg"
            disabled={library.assetCount == 0}
            on:click={() => (isShowShareUserSelection = true)}
          >
            Share
          </Button>
        {/if}
      </svelte:fragment>
    </ControlAppBar>
  {/if}

  <section class="flex flex-col my-[160px] px-6 sm:px-12 md:px-24 lg:px-40">
    <input
      on:keydown={(e) => {
        if (e.key == 'Enter') {
          isEditingTitle = false;
          titleInput.blur();
        }
      }}
      on:focus={() => (isEditingTitle = true)}
      on:blur={() => (isEditingTitle = false)}
      class={`transition-all text-6xl text-immich-primary dark:text-immich-dark-primary w-[99%] border-b-2 border-transparent outline-none ${
        isOwned ? 'hover:border-gray-400' : 'hover:border-transparent'
      } focus:outline-none focus:border-b-2 focus:border-immich-primary dark:focus:border-immich-dark-primary bg-immich-bg dark:bg-immich-dark-bg dark:focus:bg-immich-dark-gray`}
      type="text"
      bind:value={library.libraryName}
      disabled={!isOwned}
      bind:this={titleInput}
    />

    {#if library.assetCount > 0}
      <span class="flex gap-2 my-4 text-sm text-gray-500 font-medium" data-testid="library-details">
        <p class="">{getDateRange()}</p>
        <p>·</p>
        <p>{library.assetCount} items</p>
      </span>
    {/if}
    {#if library.shared}
      <div class="flex my-6 gap-x-1">
        {#each library.sharedUsers as user (user.id)}
          <button on:click={() => (isShowShareInfoModal = true)}>
            <UserAvatar {user} size="md" autoColor />
          </button>
        {/each}

        <button
          style:display={isOwned ? 'block' : 'none'}
          on:click={() => (isShowShareUserSelection = true)}
          title="Add more users"
          class="h-12 w-12 border bg-white transition-colors hover:bg-gray-300 text-3xl flex place-items-center place-content-center rounded-full"
          >+</button
        >
      </div>
    {/if}

    {#if library.assetCount > 0}
      <GalleryViewer assets={library.assets} {sharedLink} bind:selectedAssets={multiSelectAsset} viewFrom="library-page" />
    {:else}
      <!-- Library is empty - Show asset selectection buttons -->
      <section id="empty-library" class=" mt-[200px] flex place-content-center place-items-center">
        <div class="w-[300px]">
          <p class="text-xs dark:text-immich-dark-fg">ADD PHOTOS</p>
          <button
            on:click={() => (isShowAssetSelection = true)}
            class="w-full py-8 border bg-immich-bg dark:bg-immich-dark-gray text-immich-fg dark:text-immich-dark-fg dark:hover:text-immich-dark-primary rounded-md mt-5 flex place-items-center gap-6 px-8 transition-all hover:bg-gray-100 hover:text-immich-primary dark:border-none"
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
    libraryId={library.id}
    assetsInLibrary={library.assets}
    on:go-back={() => (isShowAssetSelection = false)}
    on:create-library={createLibraryHandler}
  />
{/if}

{#if isShowShareUserSelection}
  <UserSelectionModal
    {library}
    on:close={() => (isShowShareUserSelection = false)}
    on:add-user={addUserHandler}
    on:sharedlinkclick={onSharedLinkClickHandler}
    sharedUsersInLibrary={new Set(library.sharedUsers)}
  />
{/if}

{#if isShowShareLinkModal}
  <CreateSharedLinkModal on:close={() => (isShowShareLinkModal = false)} shareType={SharedLinkType.Library} {library} />
{/if}
{#if isShowShareInfoModal}
  <ShareInfoModal on:close={() => (isShowShareInfoModal = false)} {library} on:user-deleted={sharedUserDeletedHandler} />
{/if}

{#if isShowThumbnailSelection}
  <ThumbnailSelection
    {library}
    on:close={() => (isShowThumbnailSelection = false)}
    on:thumbnail-selected={setLibraryThumbnailHandler}
  />
{/if}

{#if isShowDeleteConfirmation}
  <ConfirmDialogue
    title="Delete Library"
    confirmText="Delete"
    on:confirm={removeLibrary}
    on:cancel={() => (isShowDeleteConfirmation = false)}
  >
    <svelte:fragment slot="prompt">
      <p>Are you sure you want to delete the library <b>{library.libraryName}</b>?</p>
      <p>If this library is shared, other users will not be able to access it anymore.</p>
    </svelte:fragment>
  </ConfirmDialogue>
{/if}
