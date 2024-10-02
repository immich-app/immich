<script lang="ts">
  import { onMount } from 'svelte';
  import { groupBy } from 'lodash-es';
  import { addUsersToAlbum, deleteAlbum, type AlbumUserAddDto, type AlbumResponseDto, isHttpError } from '@immich/sdk';
  import { mdiDeleteOutline, mdiShareVariantOutline, mdiFolderDownloadOutline, mdiRenameOutline } from '@mdi/js';
  import EditAlbumForm from '$lib/components/forms/edit-album-form.svelte';
  import CreateSharedLinkModal from '$lib/components/shared-components/create-share-link-modal/create-shared-link-modal.svelte';
  import {
    NotificationType,
    notificationController,
  } from '$lib/components/shared-components/notification/notification';
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import RightClickContextMenu from '$lib/components/shared-components/context-menu/right-click-context-menu.svelte';
  import AlbumsTable from '$lib/components/album-page/albums-table.svelte';
  import AlbumCardGroup from '$lib/components/album-page/album-card-group.svelte';
  import UserSelectionModal from '$lib/components/album-page/user-selection-modal.svelte';
  import { handleError } from '$lib/utils/handle-error';
  import { downloadAlbum } from '$lib/utils/asset-utils';
  import { normalizeSearchString } from '$lib/utils/string-utils';
  import {
    getSelectedAlbumGroupOption,
    type AlbumGroup,
    confirmAlbumDelete,
    sortAlbums,
    stringToSortOrder,
  } from '$lib/utils/album-utils';
  import type { ContextMenuPosition } from '$lib/utils/context-menu';
  import { user } from '$lib/stores/user.store';
  import {
    AlbumGroupBy,
    AlbumSortBy,
    AlbumFilter,
    AlbumViewMode,
    SortOrder,
    locale,
    type AlbumViewSettings,
  } from '$lib/stores/preferences.store';
  import { goto } from '$app/navigation';
  import { AppRoute } from '$lib/constants';
  import { t } from 'svelte-i18n';

  export let ownedAlbums: AlbumResponseDto[] = [];
  export let sharedAlbums: AlbumResponseDto[] = [];
  export let searchQuery: string = '';
  export let userSettings: AlbumViewSettings;
  export let allowEdit = false;
  export let showOwner = false;
  export let albumGroupIds: string[] = [];

  interface AlbumGroupOption {
    [option: string]: (order: SortOrder, albums: AlbumResponseDto[]) => AlbumGroup[];
  }

  const groupOptions: AlbumGroupOption = {
    /** No grouping */
    [AlbumGroupBy.None]: (order, albums): AlbumGroup[] => {
      return [
        {
          id: $t('albums'),
          name: $t('albums'),
          albums,
        },
      ];
    },

    /** Group by year */
    [AlbumGroupBy.Year]: (order, albums): AlbumGroup[] => {
      const unknownYear = $t('unknown_year');
      const useStartDate = userSettings.sortBy === AlbumSortBy.OldestPhoto;

      const groupedByYear = groupBy(albums, (album) => {
        const date = useStartDate ? album.startDate : album.endDate;
        return date ? new Date(date).getFullYear() : unknownYear;
      });

      const sortSign = order === SortOrder.Desc ? -1 : 1;
      const sortedByYear = Object.entries(groupedByYear).sort(([a], [b]) => {
        // We make sure empty albums stay at the end of the list
        if (a === unknownYear) {
          return 1;
        } else if (b === unknownYear) {
          return -1;
        } else {
          return (Number.parseInt(a) - Number.parseInt(b)) * sortSign;
        }
      });

      return sortedByYear.map(([year, albums]) => ({
        id: year,
        name: year,
        albums,
      }));
    },

    /** Group by owner */
    [AlbumGroupBy.Owner]: (order, albums): AlbumGroup[] => {
      const currentUserId = $user.id;
      const groupedByOwnerIds = groupBy(albums, 'ownerId');

      const sortSign = order === SortOrder.Desc ? -1 : 1;
      const sortedByOwnerNames = Object.entries(groupedByOwnerIds).sort(([ownerA, albumsA], [ownerB, albumsB]) => {
        // We make sure owned albums stay either at the beginning or the end
        // of the list
        if (ownerA === currentUserId) {
          return -sortSign;
        } else if (ownerB === currentUserId) {
          return sortSign;
        } else {
          return albumsA[0].owner.name.localeCompare(albumsB[0].owner.name, $locale) * sortSign;
        }
      });

      return sortedByOwnerNames.map(([ownerId, albums]) => ({
        id: ownerId,
        name: ownerId === currentUserId ? $t('my_albums') : albums[0].owner.name,
        albums,
      }));
    },
  };

  let albums: AlbumResponseDto[] = [];
  let filteredAlbums: AlbumResponseDto[] = [];
  let groupedAlbums: AlbumGroup[] = [];

  let albumGroupOption: string = AlbumGroupBy.None;

  let showShareByURLModal = false;

  let albumToEdit: AlbumResponseDto | null = null;
  let albumToShare: AlbumResponseDto | null = null;
  let albumToDelete: AlbumResponseDto | null = null;

  let contextMenuPosition: ContextMenuPosition = { x: 0, y: 0 };
  let contextMenuTargetAlbum: AlbumResponseDto | null = null;
  let isOpen = false;

  // Step 1: Filter between Owned and Shared albums, or both.
  $: {
    switch (userSettings.filter) {
      case AlbumFilter.Owned: {
        albums = ownedAlbums;
        break;
      }
      case AlbumFilter.Shared: {
        albums = sharedAlbums;
        break;
      }
      default: {
        const userId = $user.id;
        const nonOwnedAlbums = sharedAlbums.filter((album) => album.ownerId !== userId);
        albums = nonOwnedAlbums.length > 0 ? ownedAlbums.concat(nonOwnedAlbums) : ownedAlbums;
      }
    }
  }

  // Step 2: Filter using the given search query.
  $: {
    if (searchQuery) {
      const searchAlbumNormalized = normalizeSearchString(searchQuery);

      filteredAlbums = albums.filter((album) => {
        return normalizeSearchString(album.albumName).includes(searchAlbumNormalized);
      });
    } else {
      filteredAlbums = albums;
    }
  }

  // Step 3: Group albums.
  $: {
    albumGroupOption = getSelectedAlbumGroupOption(userSettings);
    const groupFunc = groupOptions[albumGroupOption] ?? groupOptions[AlbumGroupBy.None];
    groupedAlbums = groupFunc(stringToSortOrder(userSettings.groupOrder), filteredAlbums);
  }

  // Step 4: Sort albums amongst each group.
  $: {
    groupedAlbums = groupedAlbums.map((group) => ({
      id: group.id,
      name: group.name,
      albums: sortAlbums(group.albums, { sortBy: userSettings.sortBy, orderBy: userSettings.sortOrder }),
    }));

    albumGroupIds = groupedAlbums.map(({ id }) => id);
  }

  $: showFullContextMenu = allowEdit && contextMenuTargetAlbum && contextMenuTargetAlbum.ownerId === $user.id;

  onMount(async () => {
    if (allowEdit) {
      await removeAlbumsIfEmpty();
    }
  });

  const showAlbumContextMenu = (contextMenuDetail: ContextMenuPosition, album: AlbumResponseDto) => {
    contextMenuTargetAlbum = album;
    contextMenuPosition = {
      x: contextMenuDetail.x,
      y: contextMenuDetail.y,
    };
    isOpen = true;
  };

  const closeAlbumContextMenu = () => {
    isOpen = false;
  };

  const handleDownloadAlbum = async () => {
    if (contextMenuTargetAlbum) {
      const album = contextMenuTargetAlbum;
      closeAlbumContextMenu();
      await downloadAlbum(album);
    }
  };

  const handleDeleteAlbum = async (albumToDelete: AlbumResponseDto) => {
    try {
      await deleteAlbum({
        id: albumToDelete.id,
      });
    } catch (error) {
      // In rare cases deleting an album completes after the list of albums has been requested,
      // leading to a bad request error.
      // Since the album is already deleted, the error is ignored.
      const isBadRequest = isHttpError(error) && error.status === 400;
      if (!isBadRequest) {
        throw error;
      }
    }

    ownedAlbums = ownedAlbums.filter(({ id }) => id !== albumToDelete.id);
    sharedAlbums = sharedAlbums.filter(({ id }) => id !== albumToDelete.id);
  };

  const setAlbumToDelete = async () => {
    albumToDelete = contextMenuTargetAlbum ?? null;
    closeAlbumContextMenu();
    await deleteSelectedAlbum();
  };

  const handleEdit = (album: AlbumResponseDto) => {
    albumToEdit = album;
    closeAlbumContextMenu();
  };

  const deleteSelectedAlbum = async () => {
    if (!albumToDelete) {
      return;
    }

    const isConfirmed = await confirmAlbumDelete(albumToDelete);

    if (!isConfirmed) {
      return;
    }

    try {
      await handleDeleteAlbum(albumToDelete);
    } catch {
      notificationController.show({
        message: $t('errors.unable_to_delete_album'),
        type: NotificationType.Error,
      });
    } finally {
      albumToDelete = null;
    }
  };

  const removeAlbumsIfEmpty = async () => {
    const albumsToRemove = ownedAlbums.filter((album) => album.assetCount === 0 && !album.albumName);
    await Promise.allSettled(albumsToRemove.map((album) => handleDeleteAlbum(album)));
  };

  const updateAlbumInfo = (album: AlbumResponseDto) => {
    ownedAlbums[ownedAlbums.findIndex(({ id }) => id === album.id)] = album;
    sharedAlbums[sharedAlbums.findIndex(({ id }) => id === album.id)] = album;
  };

  const successEditAlbumInfo = (album: AlbumResponseDto) => {
    albumToEdit = null;

    notificationController.show({
      message: $t('album_info_updated'),
      type: NotificationType.Info,
      button: {
        text: $t('view_album'),
        onClick() {
          return goto(`${AppRoute.ALBUMS}/${album.id}`);
        },
      },
    });

    updateAlbumInfo(album);
  };

  const handleAddUsers = async (albumUsers: AlbumUserAddDto[]) => {
    if (!albumToShare) {
      return;
    }
    try {
      const album = await addUsersToAlbum({
        id: albumToShare.id,
        addUsersDto: {
          albumUsers,
        },
      });
      updateAlbumInfo(album);
    } catch (error) {
      handleError(error, $t('errors.unable_to_add_album_users'));
    } finally {
      albumToShare = null;
    }
  };

  const handleSharedLinkCreated = (album: AlbumResponseDto) => {
    album.shared = true;
    album.hasSharedLink = true;
    updateAlbumInfo(album);
  };

  const openShareModal = () => {
    albumToShare = contextMenuTargetAlbum;
    closeAlbumContextMenu();
  };

  const closeShareModal = () => {
    albumToShare = null;
    showShareByURLModal = false;
  };
</script>

{#if albums.length > 0}
  {#if userSettings.view === AlbumViewMode.Cover}
    <!-- Album Cards -->
    {#if albumGroupOption === AlbumGroupBy.None}
      <AlbumCardGroup
        albums={groupedAlbums[0].albums}
        {showOwner}
        showDateRange
        showItemCount
        onShowContextMenu={showAlbumContextMenu}
      />
    {:else}
      {#each groupedAlbums as albumGroup (albumGroup.id)}
        <AlbumCardGroup
          albums={albumGroup.albums}
          group={albumGroup}
          {showOwner}
          showDateRange
          showItemCount
          onShowContextMenu={showAlbumContextMenu}
        />
      {/each}
    {/if}
  {:else if userSettings.view === AlbumViewMode.List}
    <!-- Album Table -->
    <AlbumsTable {groupedAlbums} {albumGroupOption} onShowContextMenu={showAlbumContextMenu} />
  {/if}
{:else}
  <!-- Empty Message -->
  <slot name="empty" />
{/if}

<!-- Context Menu -->
<RightClickContextMenu title={$t('album_options')} {...contextMenuPosition} {isOpen} onClose={closeAlbumContextMenu}>
  {#if showFullContextMenu}
    <MenuOption
      icon={mdiRenameOutline}
      text={$t('edit_album')}
      onClick={() => contextMenuTargetAlbum && handleEdit(contextMenuTargetAlbum)}
    />
    <MenuOption icon={mdiShareVariantOutline} text={$t('share')} onClick={() => openShareModal()} />
  {/if}
  <MenuOption icon={mdiFolderDownloadOutline} text={$t('download')} onClick={() => handleDownloadAlbum()} />
  {#if showFullContextMenu}
    <MenuOption icon={mdiDeleteOutline} text={$t('delete')} onClick={() => setAlbumToDelete()} />
  {/if}
</RightClickContextMenu>

{#if allowEdit}
  <!-- Edit Modal -->
  {#if albumToEdit}
    <EditAlbumForm
      album={albumToEdit}
      onEditSuccess={successEditAlbumInfo}
      onCancel={() => (albumToEdit = null)}
      onClose={() => (albumToEdit = null)}
    />
  {/if}

  <!-- Share Modal -->
  {#if albumToShare}
    {#if showShareByURLModal}
      <CreateSharedLinkModal
        albumId={albumToShare.id}
        onClose={() => closeShareModal()}
        onCreated={() => albumToShare && handleSharedLinkCreated(albumToShare)}
      />
    {:else}
      <UserSelectionModal
        album={albumToShare}
        onSelect={handleAddUsers}
        onShare={() => (showShareByURLModal = true)}
        onClose={() => closeShareModal()}
      />
    {/if}
  {/if}
{/if}
