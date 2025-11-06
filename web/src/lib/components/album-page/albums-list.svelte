<script lang="ts">
  import AlbumCardGroup from '$lib/components/album-page/album-card-group.svelte';
  import AlbumsTable from '$lib/components/album-page/albums-table.svelte';
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import RightClickContextMenu from '$lib/components/shared-components/context-menu/right-click-context-menu.svelte';
  import { eventManager } from '$lib/managers/event-manager.svelte';
  import { handleDeleteAlbum, onEditAlbum, onShareAlbum } from '$lib/services/album.service';
  import {
    AlbumFilter,
    AlbumGroupBy,
    AlbumSortBy,
    AlbumViewMode,
    SortOrder,
    locale,
    type AlbumViewSettings,
  } from '$lib/stores/preferences.store';
  import { user } from '$lib/stores/user.store';
  import { userInteraction } from '$lib/stores/user.svelte';
  import { getSelectedAlbumGroupOption, sortAlbums, stringToSortOrder, type AlbumGroup } from '$lib/utils/album-utils';
  import { downloadAlbum } from '$lib/utils/asset-utils';
  import type { ContextMenuPosition } from '$lib/utils/context-menu';
  import { normalizeSearchString } from '$lib/utils/string-utils';
  import { type AlbumResponseDto } from '@immich/sdk';
  import { mdiDeleteOutline, mdiDownload, mdiRenameOutline, mdiShareVariantOutline } from '@mdi/js';
  import { groupBy } from 'lodash-es';
  import { onDestroy, onMount, type Snippet } from 'svelte';
  import { t } from 'svelte-i18n';
  import { run } from 'svelte/legacy';

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

  let albums: AlbumResponseDto[] = $state([]);
  let filteredAlbums: AlbumResponseDto[] = $state([]);
  let groupedAlbums: AlbumGroup[] = $state([]);

  let albumGroupOption: string = $state(AlbumGroupBy.None);

  let contextMenuPosition: ContextMenuPosition = $state({ x: 0, y: 0 });
  let selectedAlbum: AlbumResponseDto | undefined = $state();
  let isOpen = $state(false);

  // Step 1: Filter between Owned and Shared albums, or both.
  run(() => {
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
  });

  // Step 2: Filter using the given search query.
  run(() => {
    if (searchQuery) {
      const searchAlbumNormalized = normalizeSearchString(searchQuery);

      filteredAlbums = albums.filter((album) => {
        return normalizeSearchString(album.albumName).includes(searchAlbumNormalized);
      });
    } else {
      filteredAlbums = albums;
    }
  });

  // Step 3: Group albums.
  run(() => {
    albumGroupOption = getSelectedAlbumGroupOption(userSettings);
    const groupFunc = groupOptions[albumGroupOption] ?? groupOptions[AlbumGroupBy.None];
    groupedAlbums = groupFunc(stringToSortOrder(userSettings.groupOrder), filteredAlbums);
  });

  // Step 4: Sort albums amongst each group.
  run(() => {
    groupedAlbums = groupedAlbums.map((group) => ({
      id: group.id,
      name: group.name,
      albums: sortAlbums(group.albums, { sortBy: userSettings.sortBy, orderBy: userSettings.sortOrder }),
    }));

    albumGroupIds = groupedAlbums.map(({ id }) => id);
  });

  let showFullContextMenu = $derived(allowEdit && selectedAlbum && selectedAlbum.ownerId === $user.id);

  onMount(async () => {
    if (allowEdit) {
      await removeAlbumsIfEmpty();
    }

    eventManager.on('album.update', onUpdate).on('album.delete', onDelete);
  });

  onDestroy(() => {
    return () => void eventManager.off('album.update', onUpdate).off('album.delete', onDelete);
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

  const handleDownloadAlbum = async () => {
    if (selectedAlbum) {
      closeAlbumContextMenu();
      await downloadAlbum(selectedAlbum);
    }
  };

  const handleDelete = async (album: AlbumResponseDto) => {
    closeAlbumContextMenu();
    await handleDeleteAlbum(album);
  };

  const handleEdit = async (album: AlbumResponseDto) => {
    closeAlbumContextMenu();
    await onEditAlbum(album);
  };

  const removeAlbumsIfEmpty = async () => {
    const albumsToRemove = ownedAlbums.filter((album) => album.assetCount === 0 && !album.albumName);
    await Promise.allSettled(albumsToRemove.map((album) => handleDeleteAlbum(album, { prompt: false })));
  };

  const onUpdate = (album: AlbumResponseDto) => {
    ownedAlbums[ownedAlbums.findIndex(({ id }) => id === album.id)] = album;
    sharedAlbums[sharedAlbums.findIndex(({ id }) => id === album.id)] = album;

    for (const cachedAlbum of userInteraction.recentAlbums || []) {
      if (cachedAlbum.id === album.id) {
        Object.assign(cachedAlbum, { ...cachedAlbum, ...album });
        break;
      }
    }
  };

  const onDelete = (album: AlbumResponseDto) => {
    ownedAlbums = ownedAlbums.filter(({ id }) => id !== album.id);
    sharedAlbums = sharedAlbums.filter(({ id }) => id !== album.id);
  };

  const openShareModal = async () => {
    if (!selectedAlbum) {
      return;
    }

    closeAlbumContextMenu();
    await onShareAlbum(selectedAlbum);
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
  {@render empty?.()}
{/if}

<!-- Context Menu -->
<RightClickContextMenu title={$t('album_options')} {...contextMenuPosition} {isOpen} onClose={closeAlbumContextMenu}>
  {#if showFullContextMenu}
    <MenuOption
      icon={mdiRenameOutline}
      text={$t('edit_album')}
      onClick={() => selectedAlbum && handleEdit(selectedAlbum)}
    />
    <MenuOption icon={mdiShareVariantOutline} text={$t('share')} onClick={() => openShareModal()} />
  {/if}
  <MenuOption icon={mdiDownload} text={$t('download')} onClick={() => handleDownloadAlbum()} />
  {#if showFullContextMenu}
    <MenuOption
      icon={mdiDeleteOutline}
      text={$t('delete')}
      onClick={() => selectedAlbum && handleDelete(selectedAlbum)}
    />
  {/if}
</RightClickContextMenu>
