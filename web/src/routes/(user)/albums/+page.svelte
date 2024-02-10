<script lang="ts" context="module">
  export interface Sort {
    title: string;
    sortDesc: boolean;
    widthClass: string;
    sortFn: (reverse: boolean, albums: AlbumResponseDto[]) => AlbumResponseDto[];
  }
</script>

<script lang="ts">
  import { albumViewSettings } from '$lib/stores/preferences.store';
  import AlbumCard from '$lib/components/album-page/album-card.svelte';
  import { goto } from '$app/navigation';
  import ContextMenu from '$lib/components/shared-components/context-menu/context-menu.svelte';
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import type { PageData } from './$types';
  import { useAlbums } from './albums.bloc';
  import EmptyPlaceholder from '$lib/components/shared-components/empty-placeholder.svelte';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import LinkButton from '$lib/components/elements/buttons/link-button.svelte';
  import { onMount } from 'svelte';
  import { flip } from 'svelte/animate';
  import Dropdown from '$lib/components/elements/dropdown.svelte';
  import ConfirmDialogue from '$lib/components/shared-components/confirm-dialogue.svelte';
  import { AppRoute, dateFormats } from '$lib/constants';
  import { locale, AlbumViewMode } from '$lib/stores/preferences.store';
  import {
    notificationController,
    NotificationType,
  } from '$lib/components/shared-components/notification/notification';
  import type { AlbumResponseDto } from '@api';
  import TableHeader from '$lib/components/elements/table-header.svelte';
  import FullScreenModal from '$lib/components/shared-components/full-screen-modal.svelte';
  import EditAlbumForm from '$lib/components/forms/edit-album-form.svelte';
  import Icon from '$lib/components/elements/icon.svelte';
  import { orderBy } from 'lodash-es';
  import {
    mdiPlusBoxOutline,
    mdiArrowDownThin,
    mdiArrowUpThin,
    mdiFormatListBulletedSquare,
    mdiPencilOutline,
    mdiTrashCanOutline,
    mdiViewGridOutline,
    mdiDeleteOutline,
  } from '@mdi/js';

  export let data: PageData;

  let shouldShowEditUserForm = false;
  let selectedAlbum: AlbumResponseDto;

  let sortByOptions: Record<string, Sort> = {
    albumTitle: {
      title: 'Album title',
      sortDesc: $albumViewSettings.sortDesc, // Load Sort Direction
      widthClass: 'text-left w-8/12 sm:w-4/12 md:w-4/12 md:w-4/12 xl:w-[30%] 2xl:w-[40%]',
      sortFn: (reverse, albums) => {
        return orderBy(albums, 'albumName', [reverse ? 'desc' : 'asc']);
      },
    },
    numberOfAssets: {
      title: 'Number of assets',
      sortDesc: $albumViewSettings.sortDesc,
      widthClass: 'text-center w-4/12 m:w-2/12 md:w-2/12 xl:w-[15%] 2xl:w-[12%]',
      sortFn: (reverse, albums) => {
        return orderBy(albums, 'assetCount', [reverse ? 'desc' : 'asc']);
      },
    },
    lastModified: {
      title: 'Last modified',
      sortDesc: $albumViewSettings.sortDesc,
      widthClass: 'text-center hidden sm:block w-3/12 xl:w-[15%] 2xl:w-[12%]',
      sortFn: (reverse, albums) => {
        return orderBy(albums, [(album) => new Date(album.updatedAt)], [reverse ? 'desc' : 'asc']);
      },
    },
    created: {
      title: 'Created date',
      sortDesc: $albumViewSettings.sortDesc,
      widthClass: 'text-center hidden sm:block w-3/12 xl:w-[15%] 2xl:w-[12%]',
      sortFn: (reverse, albums) => {
        return orderBy(albums, [(album) => new Date(album.createdAt)], [reverse ? 'desc' : 'asc']);
      },
    },
    mostRecent: {
      title: 'Most recent photo',
      sortDesc: $albumViewSettings.sortDesc,
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
    mostOld: {
      title: 'Oldest photo',
      sortDesc: $albumViewSettings.sortDesc,
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
  };

  const handleEdit = (album: AlbumResponseDto) => {
    selectedAlbum = { ...album };
    shouldShowEditUserForm = true;
  };

  const {
    albums: unsortedAlbums,
    isShowContextMenu,
    contextMenuPosition,
    contextMenuTargetAlbum,
    createAlbum,
    deleteAlbum,
    showAlbumContextMenu,
    closeAlbumContextMenu,
  } = useAlbums({ albums: data.albums });

  let albums = unsortedAlbums;
  let albumToDelete: AlbumResponseDto | null;

  const chooseAlbumToDelete = (album: AlbumResponseDto) => {
    $contextMenuTargetAlbum = album;
    setAlbumToDelete();
  };

  const setAlbumToDelete = () => {
    albumToDelete = $contextMenuTargetAlbum ?? null;
    closeAlbumContextMenu();
  };

  const deleteSelectedAlbum = async () => {
    if (!albumToDelete) {
      return;
    }
    try {
      await deleteAlbum(albumToDelete);
    } catch {
      notificationController.show({
        message: 'Error deleting album',
        type: NotificationType.Error,
      });
    } finally {
      albumToDelete = null;
    }
  };

  $: {
    for (const key in sortByOptions) {
      if (sortByOptions[key].title === $albumViewSettings.sortBy) {
        $albums = sortByOptions[key].sortFn(sortByOptions[key].sortDesc, $unsortedAlbums);
        $albumViewSettings.sortDesc = sortByOptions[key].sortDesc; // "Save" sortDesc
        $albumViewSettings.sortBy = sortByOptions[key].title;
        break;
      }
    }
  }

  const searchSort = (searched: string): Sort => {
    for (const key in sortByOptions) {
      if (sortByOptions[key].title === searched) {
        return sortByOptions[key];
      }
    }
    return sortByOptions[0];
  };

  const handleCreateAlbum = async () => {
    const newAlbum = await createAlbum();
    if (newAlbum) {
      goto(`${AppRoute.ALBUMS}/${newAlbum.id}`);
    }
  };

  const dateLocaleString = (dateString: string) => {
    return new Date(dateString).toLocaleDateString($locale, dateFormats.album);
  };

  onMount(() => {
    removeAlbumsIfEmpty();
  });

  const removeAlbumsIfEmpty = async () => {
    try {
      for (const album of $albums) {
        if (album.assetCount == 0 && album.albumName == '') {
          await deleteAlbum(album);
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  const successModifyAlbum = () => {
    shouldShowEditUserForm = false;
    notificationController.show({
      message: 'Album infos updated',
      type: NotificationType.Info,
    });
    $albums[$albums.findIndex((x) => x.id === selectedAlbum.id)] = selectedAlbum;
  };

  const handleChangeListMode = () => {
    $albumViewSettings.view =
      $albumViewSettings.view === AlbumViewMode.Cover ? AlbumViewMode.List : AlbumViewMode.Cover;
  };
</script>

{#if shouldShowEditUserForm}
  <FullScreenModal on:clickOutside={() => (shouldShowEditUserForm = false)}>
    <EditAlbumForm
      album={selectedAlbum}
      on:editSuccess={() => successModifyAlbum()}
      on:cancel={() => (shouldShowEditUserForm = false)}
    />
  </FullScreenModal>
{/if}

<UserPageLayout title={data.meta.title}>
  <div class="flex place-items-center gap-2" slot="buttons">
    <LinkButton on:click={handleCreateAlbum}>
      <div class="flex place-items-center gap-2 text-sm">
        <Icon path={mdiPlusBoxOutline} size="18" />
        Create album
      </div>
    </LinkButton>

    <Dropdown
      options={Object.values(sortByOptions)}
      selectedOption={searchSort($albumViewSettings.sortBy)}
      render={(option) => {
        return {
          title: option.title,
          icon: option.sortDesc ? mdiArrowDownThin : mdiArrowUpThin,
        };
      }}
      on:select={(event) => {
        for (const key in sortByOptions) {
          if (sortByOptions[key].title === event.detail.title) {
            sortByOptions[key].sortDesc = !sortByOptions[key].sortDesc;
            $albumViewSettings.sortBy = sortByOptions[key].title;
          }
        }
      }}
    />

    <LinkButton on:click={() => handleChangeListMode()}>
      <div class="flex place-items-center gap-2 text-sm">
        {#if $albumViewSettings.view === AlbumViewMode.List}
          <Icon path={mdiViewGridOutline} size="18" />
          <p class="hidden sm:block">Cover</p>
        {:else}
          <Icon path={mdiFormatListBulletedSquare} size="18" />
          <p class="hidden sm:block">List</p>
        {/if}
      </div>
    </LinkButton>
  </div>
  {#if $albums.length > 0}
    <!-- Album Card -->
    {#if $albumViewSettings.view === AlbumViewMode.Cover}
      <div class="grid grid-cols-[repeat(auto-fill,minmax(14rem,1fr))]">
        {#each $albums as album, index (album.id)}
          <a data-sveltekit-preload-data="hover" href="{AppRoute.ALBUMS}/{album.id}" animate:flip={{ duration: 200 }}>
            <AlbumCard
              preload={index < 20}
              {album}
              on:showalbumcontextmenu={(e) => showAlbumContextMenu(e.detail, album)}
            />
          </a>
        {/each}
      </div>
    {:else if $albumViewSettings.view === AlbumViewMode.List}
      <table class="mt-5 w-full text-left">
        <thead
          class="mb-4 flex h-12 w-full rounded-md border bg-gray-50 text-immich-primary dark:border-immich-dark-gray dark:bg-immich-dark-gray dark:text-immich-dark-primary"
        >
          <tr class="flex w-full place-items-center p-2 md:p-5">
            {#each Object.keys(sortByOptions) as key (key)}
              <TableHeader bind:albumViewSettings={$albumViewSettings.sortBy} bind:option={sortByOptions[key]} />
            {/each}
            <th class="hidden text-center text-sm font-medium 2xl:block 2xl:w-[12%]">Action</th>
          </tr>
        </thead>
        <tbody
          class="block w-full overflow-y-auto rounded-md border dark:border-immich-dark-gray dark:text-immich-dark-fg"
        >
          {#each $albums as album (album.id)}
            <tr
              class="flex h-[50px] w-full place-items-center border-[3px] border-transparent p-2 text-center odd:bg-immich-gray even:bg-immich-bg hover:cursor-pointer hover:border-immich-primary/75 odd:dark:bg-immich-dark-gray/75 even:dark:bg-immich-dark-gray/50 dark:hover:border-immich-dark-primary/75 md:p-5"
              on:click={() => goto(`${AppRoute.ALBUMS}/${album.id}`)}
              on:keydown={(event) => event.key === 'Enter' && goto(`${AppRoute.ALBUMS}/${album.id}`)}
              tabindex="0"
            >
              <a data-sveltekit-preload-data="hover" class="flex w-full" href="{AppRoute.ALBUMS}/{album.id}">
                <td class="text-md text-ellipsis text-left w-8/12 sm:w-4/12 md:w-4/12 xl:w-[30%] 2xl:w-[40%]"
                  >{album.albumName}</td
                >
                <td class="text-md text-ellipsis text-center sm:w-2/12 md:w-2/12 xl:w-[15%] 2xl:w-[12%]">
                  {album.assetCount}
                  {album.assetCount > 1 ? `items` : `item`}
                </td>
                <td class="text-md hidden text-ellipsis text-center sm:block w-3/12 xl:w-[15%] 2xl:w-[12%]"
                  >{dateLocaleString(album.updatedAt)}
                </td>
                <td class="text-md hidden text-ellipsis text-center sm:block w-3/12 xl:w-[15%] 2xl:w-[12%]"
                  >{dateLocaleString(album.createdAt)}</td
                >
                <td class="text-md text-ellipsis text-center hidden xl:block xl:w-[15%] 2xl:w-[12%]">
                  {#if album.endDate}
                    {dateLocaleString(album.endDate)}
                  {:else}
                    &#10060;
                  {/if}</td
                >
                <td class="text-md text-ellipsis text-center hidden xl:block xl:w-[15%] 2xl:w-[12%]"
                  >{#if album.startDate}
                    {dateLocaleString(album.startDate)}
                  {:else}
                    &#10060;
                  {/if}</td
                >
              </a>
              <td class="text-md hidden text-ellipsis text-center 2xl:block xl:w-[15%] 2xl:w-[12%]">
                <button
                  on:click|stopPropagation={() => handleEdit(album)}
                  class="rounded-full z-1 bg-immich-primary p-3 text-gray-100 transition-all duration-150 hover:bg-immich-primary/75 dark:bg-immich-dark-primary dark:text-gray-700"
                >
                  <Icon path={mdiPencilOutline} size="16" />
                </button>
                <button
                  on:click|stopPropagation={() => chooseAlbumToDelete(album)}
                  class="rounded-full z-1 bg-immich-primary p-3 text-gray-100 transition-all duration-150 hover:bg-immich-primary/75 dark:bg-immich-dark-primary dark:text-gray-700"
                >
                  <Icon path={mdiTrashCanOutline} size="16" />
                </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}

    <!-- Empty Message -->
  {:else}
    <EmptyPlaceholder
      text="Create an album to organize your photos and videos"
      actionHandler={handleCreateAlbum}
      alt="Empty albums"
    />
  {/if}
</UserPageLayout>

<!-- Context Menu -->
{#if $isShowContextMenu}
  <ContextMenu {...$contextMenuPosition} on:outclick={closeAlbumContextMenu} on:escape={closeAlbumContextMenu}>
    <MenuOption on:click={() => setAlbumToDelete()}>
      <span class="flex place-content-center place-items-center gap-2">
        <Icon path={mdiDeleteOutline} size="18" />
        <p>Delete album</p>
      </span>
    </MenuOption>
  </ContextMenu>
{/if}

{#if albumToDelete}
  <ConfirmDialogue
    title="Delete Album"
    confirmText="Delete"
    on:confirm={deleteSelectedAlbum}
    on:cancel={() => (albumToDelete = null)}
  >
    <svelte:fragment slot="prompt">
      <p>Are you sure you want to delete the album <b>{albumToDelete.albumName}</b>?</p>
      <p>If this album is shared, other users will not be able to access it anymore.</p>
    </svelte:fragment>
  </ConfirmDialogue>
{/if}
