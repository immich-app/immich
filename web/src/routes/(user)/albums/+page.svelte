<script lang="ts">
  import { albumViewSettings } from '$lib/stores/preferences.store';
  import AlbumCard from '$lib/components/album-page/album-card.svelte';
  import { goto } from '$app/navigation';
  import ContextMenu from '$lib/components/shared-components/context-menu/context-menu.svelte';
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import DeleteOutline from 'svelte-material-icons/DeleteOutline.svelte';
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
  import { locale } from '$lib/stores/preferences.store';
  import {
    notificationController,
    NotificationType,
  } from '$lib/components/shared-components/notification/notification';
  import type { AlbumResponseDto } from '@api';

  export let data: PageData;

  const sortByOptions = ['Most recent photo', 'Last modified', 'Album title'];
  const viewOptions = [{
    name: 'Cover',
    icon: ViewGridOutline
  }, {
    name: 'List',
    icon: FormatListBulletedSquare
  }]
  const viewOptionNames = viewOptions.map(option => option.name)
  const viewOptionIcons = viewOptions.map(option => option.icon)

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
    if (sortBy === 'Most recent photo') {
      $albums = $unsortedAlbums.sort((a, b) =>
        a.lastModifiedAssetTimestamp && b.lastModifiedAssetTimestamp
          ? sortByDate(a.lastModifiedAssetTimestamp, b.lastModifiedAssetTimestamp)
          : sortByDate(a.updatedAt, b.updatedAt),
      );
    } else if (sortBy === 'Last modified') {
      $albums = $unsortedAlbums.sort((a, b) => sortByDate(a.updatedAt, b.updatedAt));
    } else if (sortBy === 'Album title') {
      $albums = $unsortedAlbums.sort((a, b) => a.albumName.localeCompare(b.albumName));
    }
  }

  const handleCreateAlbum = async () => {
    const newAlbum = await createAlbum();
    if (newAlbum) {
      goto('/albums/' + newAlbum.id);
    }
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

    <Dropdown options={sortByOptions} bind:value={$albumViewSettings.sortBy} icons={[SwapVertical]} />
    <Dropdown options={viewOptionNames} bind:value={$albumViewSettings.view} icons={viewOptionIcons} />
  </div>

  <!-- Album Card -->
  {#if $albumViewSettings.view === 'Cover'}
    <div class="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))]">
      {#each $albums as album (album.id)}
        <a data-sveltekit-preload-data="hover" href={`albums/${album.id}`} animate:flip={{ duration: 200 }}>
          <AlbumCard {album} on:showalbumcontextmenu={(e) => showAlbumContextMenu(e.detail, album)} user={data.user} />
        </a>
      {/each}
    </div>
  {:else if $albumViewSettings.view === 'List'}
    <div class="grid grid-cols-4 text-white mb-2">
      <span>Album title</span>
      <span>Assets</span>
      <span>Updated date</span>
      <span>Created date</span>
    </div>

    {#each $albums as album (album.id)}
      <a class="grid grid-cols-4" data-sveltekit-preload-data="hover" href={`albums/${album.id}`}>
         <span
          class="w-full truncate text-xl font-semibold text-immich-primary dark:text-immich-dark-primary"
          data-testid="album-name"
          title={album.albumName}
        >
          {album.albumName}
        </span>

         <span>
            {album.assetCount}
            {album.assetCount == 1 ? `item` : `items`}
         </span>

         <span>{new Date(album.updatedAt).toLocaleDateString($locale, dateFormats.album)}</span>
         <span>{new Date(album.createdAt).toLocaleDateString($locale, dateFormats.album)}</span>

         <!-- <span>{album.startDate} - {album.endDate}</span> -->
      </a>
    {/each}
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
