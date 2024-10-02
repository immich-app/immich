<script lang="ts">
  import { getAssetThumbnailUrl } from '$lib/utils';
  import { type AlbumResponseDto } from '@immich/sdk';
  import { normalizeSearchString } from '$lib/utils/string-utils.js';
  import AlbumListItemDetails from './album-list-item-details.svelte';

  export let album: AlbumResponseDto;
  export let searchQuery = '';
  export let onAlbumClick: () => void;

  let albumNameArray: string[] = ['', '', ''];

  // This part of the code is responsible for splitting album name into 3 parts where part 2 is the search query
  // It is used to highlight the search query in the album name
  $: {
    let { albumName } = album;
    let findIndex = normalizeSearchString(albumName).indexOf(normalizeSearchString(searchQuery));
    let findLength = searchQuery.length;
    albumNameArray = [
      albumName.slice(0, findIndex),
      albumName.slice(findIndex, findIndex + findLength),
      albumName.slice(findIndex + findLength),
    ];
  }
</script>

<button
  type="button"
  on:click={onAlbumClick}
  class="flex w-full gap-4 px-6 py-2 text-left transition-colors hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl"
>
  <span class="h-12 w-12 shrink-0 rounded-xl bg-slate-300">
    {#if album.albumThumbnailAssetId}
      <img
        src={getAssetThumbnailUrl(album.albumThumbnailAssetId)}
        alt={album.albumName}
        class="z-0 h-full w-full rounded-xl object-cover transition-all duration-300 hover:shadow-lg"
        data-testid="album-image"
        draggable="false"
      />
    {/if}
  </span>
  <span class="flex h-12 flex-col items-start justify-center overflow-hidden">
    <span class="w-full shrink overflow-hidden text-ellipsis whitespace-nowrap"
      >{albumNameArray[0]}<b>{albumNameArray[1]}</b>{albumNameArray[2]}</span
    >
    <span class="flex gap-1 text-sm">
      <AlbumListItemDetails {album} />
    </span>
  </span>
</button>
