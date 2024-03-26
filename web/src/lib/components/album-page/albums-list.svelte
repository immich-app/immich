<script lang="ts" context="module">
  import { AlbumFilter, AlbumViewMode, albumViewSettings } from '$lib/stores/preferences.store';
  import { goto } from '$app/navigation';
  import { AppRoute } from '$lib/constants';
  import { createAlbum, deleteAlbum, type AlbumResponseDto } from '@immich/sdk';
  import { get } from 'svelte/store';

  export const handleCreateAlbum = async () => {
    try {
      const newAlbum = await createAlbum({ createAlbumDto: { albumName: '' } });

      await goto(`${AppRoute.ALBUMS}/${newAlbum.id}`);
    } catch (error) {
      handleError(error, 'Unable to create album');
    }
  };

  export interface Sort {
    title: string;
    sortDesc: boolean;
    widthClass: string;
    sortFn: (reverse: boolean, albums: AlbumResponseDto[]) => AlbumResponseDto[];
  }

  export let sortByOptions: Sort[] = [
    {
      title: 'Album title',
      sortDesc: get(albumViewSettings).sortDesc, // Load Sort Direction
      widthClass: 'text-left w-8/12 sm:w-4/12 md:w-4/12 md:w-4/12 xl:w-[30%] 2xl:w-[40%]',
      sortFn: (reverse, albums) => {
        return orderBy(albums, 'albumName', [reverse ? 'desc' : 'asc']);
      },
    },
    {
      title: 'Number of assets',
      sortDesc: get(albumViewSettings).sortDesc,
      widthClass: 'text-center w-4/12 m:w-2/12 md:w-2/12 xl:w-[15%] 2xl:w-[12%]',
      sortFn: (reverse, albums) => {
        return orderBy(albums, 'assetCount', [reverse ? 'desc' : 'asc']);
      },
    },
    {
      title: 'Last modified',
      sortDesc: get(albumViewSettings).sortDesc,
      widthClass: 'text-center hidden sm:block w-3/12 xl:w-[15%] 2xl:w-[12%]',
      sortFn: (reverse, albums) => {
        return orderBy(albums, [(album) => new Date(album.updatedAt)], [reverse ? 'desc' : 'asc']);
      },
    },
    {
      title: 'Created date',
      sortDesc: get(albumViewSettings).sortDesc,
      widthClass: 'text-center hidden sm:block w-3/12 xl:w-[15%] 2xl:w-[12%]',
      sortFn: (reverse, albums) => {
        return orderBy(albums, [(album) => new Date(album.createdAt)], [reverse ? 'desc' : 'asc']);
      },
    },
    {
      title: 'Most recent photo',
      sortDesc: get(albumViewSettings).sortDesc,
      widthClass: 'text-center hidden xl:block xl:w-[15%] 2xl:w-[12%]',
      sortFn: (reverse, albums) => {
        return orderBy(
          albums,
          [(album) => (album.endDate ? new Date(album.endDate) : '')],
          [reverse ? 'desc' : 'asc'],
        ).sort((a, b) => {
          if (a.endDate === undefined) {
            return 1;
          }
          if (b.endDate === undefined) {
            return -1;
          }
          return 0;
        });
      },
    },
    {
      title: 'Oldest photo',
      sortDesc: get(albumViewSettings).sortDesc,
      widthClass: 'text-center hidden xl:block xl:w-[15%] 2xl:w-[12%]',
      sortFn: (reverse, albums) => {
        return orderBy(
          albums,
          [(album) => (album.startDate ? new Date(album.startDate) : null)],
          [reverse ? 'desc' : 'asc'],
        ).sort((a, b) => {
          if (a.startDate === undefined) {
            return 1;
          }
          if (b.startDate === undefined) {
            return -1;
          }
          return 0;
        });
      },
    },
  ];
</script>

<script lang="ts">
  import AlbumCard from '$lib/components/album-page/album-card.svelte';
  import Icon from '$lib/components/elements/icon.svelte';
  import EditAlbumForm from '$lib/components/forms/edit-album-form.svelte';
  import ConfirmDialogue from '$lib/components/shared-components/confirm-dialogue.svelte';
  import EmptyPlaceholder from '$lib/components/shared-components/empty-placeholder.svelte';
  import FullScreenModal from '$lib/components/shared-components/full-screen-modal.svelte';
  import {
    NotificationType,
    notificationController,
  } from '$lib/components/shared-components/notification/notification';
  import { mdiDeleteOutline } from '@mdi/js';
  import { orderBy } from 'lodash-es';
  import { onMount } from 'svelte';
  import { flip } from 'svelte/animate';
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import ContextMenu from '$lib/components/shared-components/context-menu/context-menu.svelte';
  import AlbumsTable from '$lib/components/album-page/albums-table.svelte';
  import { handleError } from '$lib/utils/handle-error';
  import type { ContextMenuPosition } from '$lib/utils/context-menu';
  import GroupTab from '$lib/components/elements/group-tab.svelte';
  import SearchBar from '$lib/components/elements/search-bar.svelte';

  export let ownedAlbums: AlbumResponseDto[];
  export let sharedAlbums: AlbumResponseDto[];
  export let searchAlbum: string;

  let albums: AlbumResponseDto[] = [];
  let shouldShowEditAlbumForm = false;
  let selectedAlbum: AlbumResponseDto;
  let albumToDelete: AlbumResponseDto | null;
  let contextMenuPosition: ContextMenuPosition = { x: 0, y: 0 };
  let contextMenuTargetAlbum: AlbumResponseDto | undefined = undefined;

  $: {
    for (const key of sortByOptions) {
      if (key.title === $albumViewSettings.sortBy) {
        switch ($albumViewSettings.filter) {
          case AlbumFilter.All: {
            albums = key.sortFn(
              key.sortDesc,
              [...sharedAlbums, ...ownedAlbums].filter(
                (album, index, self) => index === self.findIndex((item) => album.id === item.id),
              ),
            );
            break;
          }

          case AlbumFilter.Owned: {
            albums = key.sortFn(key.sortDesc, ownedAlbums);
            break;
          }

          case AlbumFilter.Shared: {
            albums = key.sortFn(key.sortDesc, sharedAlbums);
            break;
          }

          default: {
            albums = key.sortFn(
              key.sortDesc,
              [...sharedAlbums, ...ownedAlbums].filter(
                (album, index, self) => index === self.findIndex((item) => album.id === item.id),
              ),
            );
            break;
          }
        }

        $albumViewSettings.sortDesc = key.sortDesc;
        $albumViewSettings.sortBy = key.title;
        break;
      }
    }
  }

  $: isShowContextMenu = !!contextMenuTargetAlbum;
  $: albumsFiltered = albums.filter((album) => album.albumName.toLowerCase().includes(searchAlbum.toLowerCase()));

  onMount(async () => {
    await removeAlbumsIfEmpty();
  });

  function showAlbumContextMenu(contextMenuDetail: ContextMenuPosition, album: AlbumResponseDto): void {
    contextMenuTargetAlbum = album;
    contextMenuPosition = {
      x: contextMenuDetail.x,
      y: contextMenuDetail.y,
    };
  }

  function closeAlbumContextMenu() {
    contextMenuTargetAlbum = undefined;
  }

  async function handleDeleteAlbum(albumToDelete: AlbumResponseDto): Promise<void> {
    await deleteAlbum({ id: albumToDelete.id });
    ownedAlbums = ownedAlbums.filter(({ id }) => id !== albumToDelete.id);
  }

  const chooseAlbumToDelete = (album: AlbumResponseDto) => {
    contextMenuTargetAlbum = album;
    setAlbumToDelete();
  };

  const setAlbumToDelete = () => {
    albumToDelete = contextMenuTargetAlbum ?? null;
    closeAlbumContextMenu();
  };

  const handleEdit = (album: AlbumResponseDto) => {
    selectedAlbum = { ...album };
    shouldShowEditAlbumForm = true;
  };

  const deleteSelectedAlbum = async () => {
    if (!albumToDelete) {
      return;
    }
    try {
      await handleDeleteAlbum(albumToDelete);
    } catch {
      notificationController.show({
        message: 'Error deleting album',
        type: NotificationType.Error,
      });
    } finally {
      albumToDelete = null;
    }
  };

  const removeAlbumsIfEmpty = async () => {
    for (const album of ownedAlbums) {
      if (album.assetCount == 0 && album.albumName == '') {
        try {
          await handleDeleteAlbum(album);
        } catch (error) {
          console.log(error);
        }
      }
    }
  };

  const successModifyAlbum = () => {
    shouldShowEditAlbumForm = false;
    notificationController.show({
      message: 'Album infos updated',
      type: NotificationType.Info,
    });
    ownedAlbums[ownedAlbums.findIndex((x) => x.id === selectedAlbum.id)] = selectedAlbum;
  };
</script>

{#if shouldShowEditAlbumForm}
  <FullScreenModal onClose={() => (shouldShowEditAlbumForm = false)}>
    <EditAlbumForm
      album={selectedAlbum}
      on:editSuccess={() => successModifyAlbum()}
      on:cancel={() => (shouldShowEditAlbumForm = false)}
    />
  </FullScreenModal>
{/if}

{#if albums.length > 0}
  <!-- Album Card -->
  <div class=" block xl:hidden">
    <div class="w-fit dark:text-immich-dark-fg py-2">
      <GroupTab
        filters={Object.keys(AlbumFilter)}
        selected={$albumViewSettings.filter}
        onSelect={(selected) => ($albumViewSettings.filter = selected)}
      />
    </div>
    <div class="w-60">
      <SearchBar placeholder="Search albums" bind:name={searchAlbum} isSearching={false} />
    </div>
  </div>
  {#if $albumViewSettings.view === AlbumViewMode.Cover}
    <div class="grid grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] mt-4 gap-y-4">
      {#each albumsFiltered as album, index (album.id)}
        <a data-sveltekit-preload-data="hover" href="{AppRoute.ALBUMS}/{album.id}" animate:flip={{ duration: 200 }}>
          <AlbumCard
            preload={index < 20}
            {album}
            onShowContextMenu={(position) => showAlbumContextMenu(position, album)}
          />
        </a>
      {/each}
    </div>
  {:else if $albumViewSettings.view === AlbumViewMode.List}
    <AlbumsTable
      {sortByOptions}
      {albumsFiltered}
      onChooseAlbumToDelete={(album) => chooseAlbumToDelete(album)}
      onAlbumToEdit={(album) => handleEdit(album)}
    />
  {/if}

  <!-- Empty Message -->
{:else}
  <EmptyPlaceholder text="Create an album to organize your photos and videos" onClick={handleCreateAlbum} />
{/if}

<!-- Context Menu -->
{#if isShowContextMenu}
  <section class="fixed left-0 top-0 z-10 flex h-screen w-screen">
    <ContextMenu {...contextMenuPosition} on:outclick={closeAlbumContextMenu} on:escape={closeAlbumContextMenu}>
      <MenuOption on:click={() => setAlbumToDelete()}>
        <span class="flex place-content-center place-items-center gap-2">
          <Icon path={mdiDeleteOutline} size="18" />
          <p>Delete album</p>
        </span>
      </MenuOption>
    </ContextMenu>
  </section>
{/if}

{#if albumToDelete}
  <ConfirmDialogue
    title="Delete Album"
    confirmText="Delete"
    onConfirm={deleteSelectedAlbum}
    onClose={() => (albumToDelete = null)}
  >
    <svelte:fragment slot="prompt">
      <p>Are you sure you want to delete the album <b>{albumToDelete.albumName}</b>?</p>
      <p>If this album is shared, other users will not be able to access it anymore.</p>
    </svelte:fragment>
  </ConfirmDialogue>
{/if}
