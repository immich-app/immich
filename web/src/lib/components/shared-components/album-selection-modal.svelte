<script lang="ts">
  import Icon from '$lib/components/elements/icon.svelte';
  import { getAllAlbums, type AlbumResponseDto } from '@immich/sdk';
  import { mdiPlus } from '@mdi/js';
  import { createEventDispatcher, onMount } from 'svelte';
  import AlbumListItem from '../asset-viewer/album-list-item.svelte';
  import { normalizeSearchString } from '$lib/utils/string-utils';
  import FullScreenModal from '$lib/components/shared-components/full-screen-modal.svelte';
  import { initInput } from '$lib/actions/focus';

  let albums: AlbumResponseDto[] = [];
  let recentAlbums: AlbumResponseDto[] = [];
  let filteredAlbums: AlbumResponseDto[] = [];
  let loading = true;
  let search = '';

  const dispatch = createEventDispatcher<{
    newAlbum: string;
    album: AlbumResponseDto;
  }>();

  export let shared: boolean;
  export let onClose: () => void;

  onMount(async () => {
    albums = await getAllAlbums({ shared: shared || undefined });
    recentAlbums = albums.sort((a, b) => (new Date(a.createdAt) > new Date(b.createdAt) ? -1 : 1)).slice(0, 3);
    loading = false;
  });

  $: {
    filteredAlbums =
      search.length > 0 && albums.length > 0
        ? albums.filter((album) => {
            return normalizeSearchString(album.albumName).includes(normalizeSearchString(search));
          })
        : albums;
  }

  const handleSelect = (album: AlbumResponseDto) => {
    dispatch('album', album);
  };

  const handleNew = () => {
    dispatch('newAlbum', search.length > 0 ? search : '');
  };

  const getTitle = () => {
    if (shared) {
      return 'Add to shared album';
    }
    return 'Add to album';
  };
</script>

<FullScreenModal title={getTitle()} {onClose}>
  <div class="mb-2 flex max-h-[400px] flex-col">
    {#if loading}
      {#each { length: 3 } as _}
        <div class="flex animate-pulse gap-4 px-6 py-2">
          <div class="h-12 w-12 rounded-xl bg-slate-200" />
          <div class="flex flex-col items-start justify-center gap-2">
            <span class="h-4 w-36 animate-pulse bg-slate-200" />
            <div class="flex animate-pulse gap-1">
              <span class="h-3 w-8 bg-slate-200" />
              <span class="h-3 w-20 bg-slate-200" />
            </div>
          </div>
        </div>
      {/each}
    {:else}
      <input
        class="border-b-4 border-immich-bg bg-immich-bg px-6 py-2 text-2xl focus:border-immich-primary dark:border-immich-dark-gray dark:bg-immich-dark-gray dark:focus:border-immich-dark-primary"
        placeholder="Search"
        bind:value={search}
        use:initInput
      />
      <div class="immich-scrollbar overflow-y-auto">
        <button
          type="button"
          on:click={handleNew}
          class="flex w-full items-center gap-4 px-6 py-2 transition-colors hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl"
        >
          <div class="flex h-12 w-12 items-center justify-center">
            <Icon path={mdiPlus} size="30" />
          </div>
          <p class="">
            New Album {#if search.length > 0}<b>{search}</b>{/if}
          </p>
        </button>
        {#if filteredAlbums.length > 0}
          {#if !shared && search.length === 0}
            <p class="px-5 py-3 text-xs">RECENT</p>
            {#each recentAlbums as album (album.id)}
              <AlbumListItem {album} on:album={() => handleSelect(album)} />
            {/each}
          {/if}

          {#if !shared}
            <p class="px-5 py-3 text-xs">
              {#if search.length === 0}ALL
              {/if}ALBUMS
            </p>
          {/if}
          {#each filteredAlbums as album (album.id)}
            <AlbumListItem {album} searchQuery={search} on:album={() => handleSelect(album)} />
          {/each}
        {:else if albums.length > 0}
          <p class="px-5 py-1 text-sm">It looks like you do not have any albums with this name yet.</p>
        {:else}
          <p class="px-5 py-1 text-sm">It looks like you do not have any albums yet.</p>
        {/if}
      </div>
    {/if}
  </div>
</FullScreenModal>
