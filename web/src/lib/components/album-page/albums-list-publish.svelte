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
  import { Exception } from 'handlebars';
  import AlbumCardGroupPublish from '$lib/components/album-page/album-card-group-publish.svelte';

  export let sharedAlbums: AlbumResponseDto[] = [];
  export let searchQuery: string = '';
  export let userSettings: AlbumViewSettings;
  export let showOwner = false;
  export let albumGroupIds: string[] = [];
  export let keys: Record<string, string>;

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
  };

  let albums: AlbumResponseDto[] = [];
  let filteredAlbums: AlbumResponseDto[] = [];
  let groupedAlbums: AlbumGroup[] = [];

  let albumGroupOption: string = AlbumGroupBy.None;

  let contextMenuPosition: ContextMenuPosition = { x: 0, y: 0 };
  let contextMenuTargetAlbum: AlbumResponseDto | null = null;
  let isOpen = false;

  // Step 1: Filter between Owned and Shared albums, or both.
  $: {
    albums = sharedAlbums;
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
</script>

{#if albums.length > 0}
  {#if userSettings.view === AlbumViewMode.Cover}
    <!-- Album Cards -->
    {#if albumGroupOption === AlbumGroupBy.None}
      <AlbumCardGroupPublish
        {keys}
        albums={groupedAlbums[0].albums}
        {showOwner}
        showDateRange
        showItemCount
        onShowContextMenu={showAlbumContextMenu}
      />
    {:else}
      {#each groupedAlbums as albumGroup (albumGroup.id)}
        <AlbumCardGroupPublish
          {keys}
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
  <MenuOption icon={mdiFolderDownloadOutline} text={$t('download')} onClick={() => handleDownloadAlbum()} />
</RightClickContextMenu>
