<script lang="ts" context="module">
  // table is the text printed in the table and sortTitle is the text printed in the dropDow menu

  export interface Sort {
    table: string;
    sortTitle: string;
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
  import DeleteOutline from 'svelte-material-icons/DeleteOutline.svelte';
  import FormatListBulletedSquare from 'svelte-material-icons/FormatListBulletedSquare.svelte';
  import ViewGridOutline from 'svelte-material-icons/ViewGridOutline.svelte';
  import type { PageData } from './$types';
  import PlusBoxOutline from 'svelte-material-icons/PlusBoxOutline.svelte';
  import { useAlbums } from './albums.bloc';
  import EmptyPlaceholder from '$lib/components/shared-components/empty-placeholder.svelte';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import LinkButton from '$lib/components/elements/buttons/link-button.svelte';
  import { onMount } from 'svelte';
  import { flip } from 'svelte/animate';
  import Dropdown from '$lib/components/elements/dropdown.svelte';
  import ConfirmDialogue from '$lib/components/shared-components/confirm-dialogue.svelte';
  import { dateFormats } from '$lib/constants';
  import { locale, AlbumViewMode } from '$lib/stores/preferences.store';
  import {
    notificationController,
    NotificationType,
  } from '$lib/components/shared-components/notification/notification';
  import type { AlbumResponseDto } from '@api';
  import TableHeader from '$lib/components/elements/table-header.svelte';
  import ArrowDownThin from 'svelte-material-icons/ArrowDownThin.svelte';
  import ArrowUpThin from 'svelte-material-icons/ArrowUpThin.svelte';
  import PencilOutline from 'svelte-material-icons/PencilOutline.svelte';
  import FullScreenModal from '$lib/components/shared-components/full-screen-modal.svelte';
  import EditAlbumForm from '$lib/components/forms/edit-album-form.svelte';
  import TrashCanOutline from 'svelte-material-icons/TrashCanOutline.svelte';
  import { orderBy } from 'lodash-es';

  export let data: PageData;
  let shouldShowEditUserForm = false;
  let selectedAlbum: AlbumResponseDto;

  let sortByOptions: Record<string, Sort> = {
    albumTitle: {
      table: 'Album title',
      sortTitle: 'Album title',
      sortDesc: true,
      widthClass: 'w-8/12 text-left sm:w-4/12 md:w-4/12 md:w-4/12 2xl:w-6/12',
      sortFn: (reverse, albums) => {
        return orderBy(albums, 'albumName', [reverse ? 'desc' : 'asc']);
      },
    },
    numberOfAssets: {
      table: 'Assets',
      sortTitle: 'Number of assets',
      sortDesc: true,
      widthClass: 'w-4/12 text-center sm:w-2/12 2xl:w-1/12',
      sortFn: (reverse, albums) => {
        return orderBy(albums, 'assetCount', [reverse ? 'desc' : 'asc']);
      },
    },
    lastModified: {
      table: 'Updated date',
      sortTitle: 'Last modified',
      sortDesc: true,
      widthClass: 'text-center hidden sm:block w-3/12 lg:w-2/12',
      sortFn: (reverse, albums) => {
        return orderBy(albums, [(album) => new Date(album.updatedAt)], [reverse ? 'desc' : 'asc']);
      },
    },
    mostRecent: {
      table: 'Created date',
      sortTitle: 'Most recent photo',
      sortDesc: true,
      widthClass: 'text-center hidden sm:block w-3/12 lg:w-2/12',
      sortFn: (reverse, albums) => {
        return orderBy(
          albums,
          [
            (album) =>
              album.lastModifiedAssetTimestamp ? new Date(album.lastModifiedAssetTimestamp) : new Date(album.updatedAt),
          ],
          [reverse ? 'desc' : 'asc'],
        );
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
    const { sortBy } = $albumViewSettings;
    for (const key in sortByOptions) {
      if (sortByOptions[key].sortTitle === sortBy) {
        $albums = sortByOptions[key].sortFn(sortByOptions[key].sortDesc, $unsortedAlbums);
        break;
      }
    }
  }

  const handleCreateAlbum = async () => {
    const newAlbum = await createAlbum();
    if (newAlbum) {
      goto('/albums/' + newAlbum.id);
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
        if (album.assetCount == 0 && album.albumName == 'Untitled') {
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
    if ($albumViewSettings.view === AlbumViewMode.Cover) {
      $albumViewSettings.view = AlbumViewMode.List;
    } else {
      $albumViewSettings.view = AlbumViewMode.Cover;
    }
  };
</script>

{#if shouldShowEditUserForm}
  <FullScreenModal on:clickOutside={() => (shouldShowEditUserForm = false)}>
    <EditAlbumForm
      album={selectedAlbum}
      on:edit-success={() => successModifyAlbum()}
      on:cancel={() => (shouldShowEditUserForm = false)}
    />
  </FullScreenModal>
{/if}

<UserPageLayout user={data.user} title={data.meta.title}>
  <div class="flex place-items-center gap-2" slot="buttons">
    <LinkButton on:click={handleCreateAlbum}>
      <div class="flex place-items-center gap-2 text-sm">
        <PlusBoxOutline size="18" />
        Create album
      </div>
    </LinkButton>

    <Dropdown
      options={Object.values(sortByOptions).map((CourseInfo) => CourseInfo.sortTitle)}
      bind:value={$albumViewSettings.sortBy}
      icons={Object.keys(sortByOptions).map((key) => (sortByOptions[key].sortDesc ? ArrowDownThin : ArrowUpThin))}
      on:select={(event) => {
        for (const key in sortByOptions) {
          if (sortByOptions[key].sortTitle === event.detail) {
            sortByOptions[key].sortDesc = !sortByOptions[key].sortDesc;
          }
        }
      }}
    />

    <LinkButton on:click={() => handleChangeListMode()}>
      <div class="flex place-items-center gap-2 text-sm">
        {#if $albumViewSettings.view === AlbumViewMode.List}
          <ViewGridOutline size="18" />
          <p class="hidden sm:block">Cover</p>
        {:else}
          <FormatListBulletedSquare size="18" />
          <p class="hidden sm:block">List</p>
        {/if}
      </div>
    </LinkButton>
  </div>

  <!-- Album Card -->
  {#if $albumViewSettings.view === AlbumViewMode.Cover}
    <div class="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))]">
      {#each $albums as album (album.id)}
        <a data-sveltekit-preload-data="hover" href={`albums/${album.id}`} animate:flip={{ duration: 200 }}>
          <AlbumCard {album} on:showalbumcontextmenu={(e) => showAlbumContextMenu(e.detail, album)} user={data.user} />
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
          <th class="hidden w-2/12 text-center text-sm font-medium lg:block 2xl:w-1/12">Action</th>
        </tr>
      </thead>
      <tbody
        class="block w-full overflow-y-auto rounded-md border dark:border-immich-dark-gray dark:text-immich-dark-fg"
      >
        {#each $albums as album (album.id)}
          <tr
            class="flex h-[50px] w-full place-items-center border-[3px] border-transparent p-2 text-center odd:bg-immich-gray even:bg-immich-bg hover:cursor-pointer hover:border-immich-primary/75 odd:dark:bg-immich-dark-gray/75 even:dark:bg-immich-dark-gray/50 dark:hover:border-immich-dark-primary/75 md:p-5"
            on:click={() => goto(`albums/${album.id}`)}
            on:keydown={(event) => event.key === 'Enter' && goto(`albums/${album.id}`)}
            tabindex="0"
          >
            <td class="text-md w-8/12 text-ellipsis text-left sm:w-4/12 md:w-4/12 2xl:w-6/12">{album.albumName}</td>
            <td class="text-md w-4/12 text-ellipsis text-center sm:w-2/12 md:w-2/12 2xl:w-1/12">
              {album.assetCount}
              {album.assetCount == 1 ? `item` : `items`}
            </td>
            <td class="text-md hidden w-3/12 text-ellipsis text-center sm:block lg:w-2/12"
              >{dateLocaleString(album.updatedAt)}</td
            >
            <td class="text-md hidden w-3/12 text-ellipsis text-center sm:block lg:w-2/12"
              >{dateLocaleString(album.createdAt)}</td
            >
            <td class="text-md hidden w-2/12 text-ellipsis text-center lg:block 2xl:w-1/12">
              <button
                on:click|stopPropagation={() => handleEdit(album)}
                class="rounded-full bg-immich-primary p-3 text-gray-100 transition-all duration-150 hover:bg-immich-primary/75 dark:bg-immich-dark-primary dark:text-gray-700"
              >
                <PencilOutline size="16" />
              </button>
              <button
                on:click|stopPropagation={() => chooseAlbumToDelete(album)}
                class="rounded-full bg-immich-primary p-3 text-gray-100 transition-all duration-150 hover:bg-immich-primary/75 dark:bg-immich-dark-primary dark:text-gray-700"
              >
                <TrashCanOutline size="16" />
              </button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}

  <!-- Empty Message -->
  {#if $albums.length === 0}
    <EmptyPlaceholder
      text="Create an album to organize your photos and videos"
      actionHandler={handleCreateAlbum}
      alt="Empty albums"
    />
  {/if}
</UserPageLayout>

<!-- Context Menu -->
{#if $isShowContextMenu}
  <ContextMenu {...$contextMenuPosition} on:outclick={closeAlbumContextMenu}>
    <MenuOption on:click={() => setAlbumToDelete()}>
      <span class="flex place-content-center place-items-center gap-2">
        <DeleteOutline size="18" />
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
