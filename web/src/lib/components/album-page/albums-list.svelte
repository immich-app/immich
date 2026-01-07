<script lang="ts">
  import AlbumCardGroup from '$lib/components/album-page/album-card-group.svelte';
  import AlbumsTable from '$lib/components/album-page/albums-table.svelte';
  import OnEvents from '$lib/components/OnEvents.svelte';
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import RightClickContextMenu from '$lib/components/shared-components/context-menu/right-click-context-menu.svelte';
  import AlbumEditModal from '$lib/modals/AlbumEditModal.svelte';
  import AlbumShareModal from '$lib/modals/AlbumShareModal.svelte';
  import SharedLinkCreateModal from '$lib/modals/SharedLinkCreateModal.svelte';
  import { handleDeleteAlbum, handleDownloadAlbum } from '$lib/services/album.service';
  import {
    AlbumFilter,
    AlbumGroupBy,
    AlbumSortBy,
    AlbumViewMode,
    locale,
    SortOrder,
    type AlbumViewSettings,
  } from '$lib/stores/preferences.store';
  import { user } from '$lib/stores/user.store';
  import { userInteraction } from '$lib/stores/user.svelte';
  import { getSelectedAlbumGroupOption, sortAlbums, stringToSortOrder, type AlbumGroup } from '$lib/utils/album-utils';
  import type { ContextMenuPosition } from '$lib/utils/context-menu';
  import { handleError } from '$lib/utils/handle-error';
  import { normalizeSearchString } from '$lib/utils/string-utils';
  import {
    addUsersToAlbum,
    type AlbumResponseDto,
    type AlbumUserAddDto,
    type SharedLinkResponseDto,
  } from '@immich/sdk';
  import { modalManager } from '@immich/ui';
  import { mdiDeleteOutline, mdiDownload, mdiRenameOutline, mdiShareVariantOutline } from '@mdi/js';
  import { groupBy } from 'lodash-es';
  import { onMount, type Snippet } from 'svelte';
  import { t } from 'svelte-i18n';

  interface Props {
    ownedAlbums?: AlbumResponseDto[];
    sharedAlbums?: AlbumResponseDto[];
    searchQuery?: string;
    userSettings: AlbumViewSettings;
    allowEdit?: boolean;
    showOwner?: boolean;
    albumGroupIds?: string[];
    empty?: Snippet;
  }

  let {
    ownedAlbums = $bindable([]),
    sharedAlbums = $bindable([]),
    searchQuery = '',
    userSettings,
    allowEdit = false,
    showOwner = false,
    albumGroupIds = $bindable([]),
    empty,
  }: Props = $props();

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

  let albums = $derived.by(() => {
    switch (userSettings.filter) {
      case AlbumFilter.Owned: {
        return ownedAlbums;
      }
      case AlbumFilter.Shared: {
        return sharedAlbums;
      }
      default: {
        const nonOwnedAlbums = sharedAlbums.filter((album) => album.ownerId !== $user.id);
        return nonOwnedAlbums.length > 0 ? ownedAlbums.concat(nonOwnedAlbums) : ownedAlbums;
      }
    }
  });
  const normalizedSearchQuery = $derived(normalizeSearchString(searchQuery));
  let filteredAlbums = $derived(
    normalizedSearchQuery
      ? albums.filter(({ albumName }) => normalizeSearchString(albumName).includes(normalizedSearchQuery))
      : albums,
  );

  let albumGroupOption = $derived(getSelectedAlbumGroupOption(userSettings));
  let groupedAlbums = $derived.by(() => {
    const groupFunc = groupOptions[albumGroupOption] ?? groupOptions[AlbumGroupBy.None];
    const groupedAlbums = groupFunc(stringToSortOrder(userSettings.groupOrder), filteredAlbums);

    return groupedAlbums.map((group) => ({
      id: group.id,
      name: group.name,
      albums: sortAlbums(group.albums, { sortBy: userSettings.sortBy, orderBy: userSettings.sortOrder }),
    }));
  });

  let contextMenuPosition: ContextMenuPosition = $state({ x: 0, y: 0 });
  let selectedAlbum: AlbumResponseDto | undefined = $state();
  let isOpen = $state(false);

  // TODO get rid of this
  $effect(() => {
    albumGroupIds = groupedAlbums.map(({ id }) => id);
  });

  let showFullContextMenu = $derived(allowEdit && selectedAlbum && selectedAlbum.ownerId === $user.id);

  onMount(async () => {
    if (allowEdit) {
      await removeAlbumsIfEmpty();
    }
  });

  const showAlbumContextMenu = (contextMenuDetail: ContextMenuPosition, album: AlbumResponseDto) => {
    selectedAlbum = album;
    contextMenuPosition = {
      x: contextMenuDetail.x,
      y: contextMenuDetail.y,
    };
    isOpen = true;
  };

  const closeAlbumContextMenu = () => {
    isOpen = false;
  };

  const handleSelect = async (action: 'edit' | 'share' | 'download' | 'delete') => {
    closeAlbumContextMenu();

    if (!selectedAlbum) {
      return;
    }

    switch (action) {
      case 'edit': {
        await modalManager.show(AlbumEditModal, { album: selectedAlbum });
        break;
      }

      case 'share': {
        const result = await modalManager.show(AlbumShareModal, { album: selectedAlbum });
        switch (result?.action) {
          case 'sharedUsers': {
            await handleAddUsers(selectedAlbum, result.data);
            break;
          }

          case 'sharedLink': {
            await modalManager.show(SharedLinkCreateModal, { albumId: selectedAlbum.id });
            break;
          }
        }
        break;
      }

      case 'download': {
        await handleDownloadAlbum(selectedAlbum);
        break;
      }

      case 'delete': {
        await handleDeleteAlbum(selectedAlbum);
        break;
      }
    }
  };

  const removeAlbumsIfEmpty = async () => {
    const albumsToRemove = ownedAlbums.filter((album) => album.assetCount === 0 && !album.albumName);
    await Promise.allSettled(albumsToRemove.map((album) => handleDeleteAlbum(album, { prompt: false, notify: false })));
  };

  const findAndUpdate = (albums: AlbumResponseDto[], album: AlbumResponseDto) => {
    const target = albums.find(({ id }) => id === album.id);
    if (target) {
      Object.assign(target, album);
    }

    return albums;
  };

  const onUpdate = (album: AlbumResponseDto) => {
    ownedAlbums = findAndUpdate(ownedAlbums, album);
    sharedAlbums = findAndUpdate(sharedAlbums, album);
  };

  const handleAddUsers = async (album: AlbumResponseDto, albumUsers: AlbumUserAddDto[]) => {
    try {
      const updatedAlbum = await addUsersToAlbum({
        id: album.id,
        addUsersDto: {
          albumUsers,
        },
      });
      onUpdate(updatedAlbum);
    } catch (error) {
      handleError(error, $t('errors.unable_to_add_album_users'));
    }
  };

  const onAlbumUpdate = (album: AlbumResponseDto) => {
    onUpdate(album);
    userInteraction.recentAlbums = findAndUpdate(userInteraction.recentAlbums || [], album);
  };

  const onAlbumDelete = (album: AlbumResponseDto) => {
    ownedAlbums = ownedAlbums.filter(({ id }) => id !== album.id);
    sharedAlbums = sharedAlbums.filter(({ id }) => id !== album.id);
  };

  const onSharedLinkCreate = (sharedLink: SharedLinkResponseDto) => {
    if (sharedLink.album) {
      onUpdate(sharedLink.album);
    }
  };
</script>

<OnEvents {onAlbumUpdate} {onAlbumDelete} {onSharedLinkCreate} />

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
  {@render empty?.()}
{/if}

<!-- Context Menu -->
<RightClickContextMenu title={$t('album_options')} {...contextMenuPosition} {isOpen} onClose={closeAlbumContextMenu}>
  {#if showFullContextMenu}
    <MenuOption icon={mdiRenameOutline} text={$t('edit_album')} onClick={() => handleSelect('edit')} />
    <MenuOption icon={mdiShareVariantOutline} text={$t('share')} onClick={() => handleSelect('share')} />
  {/if}
  <MenuOption icon={mdiDownload} text={$t('download')} onClick={() => handleSelect('download')} />
  {#if showFullContextMenu}
    <MenuOption icon={mdiDeleteOutline} text={$t('delete')} onClick={() => handleSelect('delete')} />
  {/if}
</RightClickContextMenu>
