<script lang="ts" context="module">
  // table is the text printed in the table and order is the text printed in the dropDow menu
  export interface Sort {
    table: string;
    dropDow: string;
    sortDesc: boolean;
    width: string;
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
  import type Icon from 'svelte-material-icons/DotsVertical.svelte';
  import TableHeader from '$lib/components/elements/table-header.svelte';
  import ArrowDownThin from 'svelte-material-icons/ArrowDownThin.svelte';
  import ArrowUpThin from 'svelte-material-icons/ArrowUpThin.svelte';

  export let data: PageData;

  let sortByOptions: Record<string, Sort> = {
    albumTitle: { table: 'Album title', dropDow: 'Album title', sortDesc: true, width: 'w-4/12' },
    numberOfAssets: { table: 'Assets', dropDow: 'Number of assets', sortDesc: true, width: 'w-2/12' },
    lastModified: { table: 'Updated date', dropDow: 'Last modified', sortDesc: true, width: 'w-3/12' },
    mostRecent: { table: 'Created date', dropDow: 'Most recent photo', sortDesc: true, width: 'w-3/12' },
  };

  const viewOptions = [
    {
      name: AlbumViewMode.Cover,
      icon: ViewGridOutline,
    },
    {
      name: AlbumViewMode.List,
      icon: FormatListBulletedSquare,
    },
  ];
  const viewOptionNames = viewOptions.map((option) => option.name);
  const viewOptionIcons: (typeof Icon)[] = viewOptions.map((option) => option.icon);

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

  const sortByDate = (a: string, b: string) => {
    const aDate = new Date(a);
    const bDate = new Date(b);
    return bDate.getTime() - aDate.getTime();
  };

  $: {
    const { sortBy } = $albumViewSettings;
    if (sortBy === sortByOptions.mostRecent.dropDow) {
      $albums = $unsortedAlbums.sort((a, b) =>
        sortByOptions.mostRecent.sortDesc
          ? a.lastModifiedAssetTimestamp && b.lastModifiedAssetTimestamp
            ? sortByDate(a.lastModifiedAssetTimestamp, b.lastModifiedAssetTimestamp)
            : sortByDate(a.updatedAt, b.updatedAt)
          : a.lastModifiedAssetTimestamp && b.lastModifiedAssetTimestamp
          ? sortByDate(b.lastModifiedAssetTimestamp, a.lastModifiedAssetTimestamp)
          : sortByDate(b.updatedAt, a.updatedAt),
      );
    } else if (sortBy === sortByOptions.albumTitle.dropDow) {
      $albums = $unsortedAlbums.sort((a, b) =>
        sortByOptions.albumTitle.sortDesc
          ? a.albumName.localeCompare(b.albumName)
          : b.albumName.localeCompare(a.albumName),
      );
    } else if (sortBy === sortByOptions.lastModified.dropDow) {
      $albums = $unsortedAlbums.sort((a, b) =>
        sortByOptions.lastModified.sortDesc
          ? sortByDate(a.updatedAt, b.updatedAt)
          : sortByDate(b.updatedAt, a.updatedAt),
      );
    } else if (sortBy === sortByOptions.numberOfAssets.dropDow) {
      $albums = $unsortedAlbums.sort((a, b) =>
        sortByOptions.numberOfAssets.sortDesc
          ? a.albumName.localeCompare(b.albumName)
          : b.albumName.localeCompare(a.albumName),
      );
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
</script>

<UserPageLayout user={data.user} title={data.meta.title}>
  <div class="flex place-items-center gap-2" slot="buttons">
    <LinkButton on:click={handleCreateAlbum}>
      <div class="flex place-items-center gap-2 text-sm">
        <PlusBoxOutline size="18" />
        Create album
      </div>
    </LinkButton>

    <Dropdown
      options={Object.values(sortByOptions).map((CourseInfo) => CourseInfo.dropDow)}
      bind:value={$albumViewSettings.sortBy}
      icons={Object.keys(sortByOptions).map((key) => (sortByOptions[key].sortDesc ? ArrowDownThin : ArrowUpThin))}
      on:changeSort={(event) => {
        for (const key in sortByOptions) {
          if (sortByOptions[key].dropDow === event.detail) {
            sortByOptions[key].sortDesc = !sortByOptions[key].sortDesc;
          }
        }
      }}
    />
    <Dropdown options={viewOptionNames} bind:value={$albumViewSettings.view} icons={viewOptionIcons} />
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
        <tr class="flex w-full place-items-center p-5">
          {#each Object.keys(sortByOptions) as key (key)}
            <TableHeader bind:albumViewSettings={$albumViewSettings.sortBy} bind:option={sortByOptions[key]} />
          {/each}
        </tr>
      </thead>
      <tbody
        class="block w-full overflow-y-auto rounded-md border dark:border-immich-dark-gray dark:text-immich-dark-fg"
      >
        {#each $albums as album (album.id)}
          <tr
            class="flex h-[50px] w-full place-items-center border-[3px] border-transparent p-5 text-center odd:bg-immich-gray even:bg-immich-bg hover:cursor-pointer hover:border-immich-primary/75 odd:dark:bg-immich-dark-gray/75 even:dark:bg-immich-dark-gray/50 dark:hover:border-immich-dark-primary/75"
            on:click={() => goto(`albums/${album.id}`)}
            on:keydown={(event) => event.key === 'Enter' && goto(`albums/${album.id}`)}
            tabindex="0"
          >
            <td class="text-md w-4/12 text-ellipsis text-left">{album.albumName}</td>
            <td class="text-md w-2/12 text-ellipsis text-center">
              {album.assetCount}
              {album.assetCount == 1 ? `item` : `items`}
            </td>
            <td class="text-md w-3/12 text-ellipsis text-center">{dateLocaleString(album.updatedAt)}</td>
            <td class="text-md w-3/12 text-ellipsis text-center">{dateLocaleString(album.createdAt)}</td>
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
