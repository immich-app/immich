<script lang="ts">
  import { onMount } from 'svelte';
  import { getAssetThumbnailUrl } from '$lib/utils';
  import Icon from '$lib/components/elements/icon.svelte';
  import { getAllAlbums, type AlbumResponseDto } from '@immich/sdk';
  import { mdiArrowRight } from '@mdi/js';
  import { handleError } from '$lib/utils/handle-error';

  interface Props {
    onAlbumsLoaded?: () => void;
  }

  let { onAlbumsLoaded }: Props = $props();

  let albums: AlbumResponseDto[] = $state([]);

  onMount(async () => {
    try {
      albums = await getAllAlbums({ top: 3 });
      onAlbumsLoaded!();
    } catch (e) {
      handleError(e, 'Could not get albums. Please try again.');
    }
  });
</script>

{#if albums.length > 0}
  {#each albums as album}
    <a
      href={'/albums/' + album.id}
      title={album.albumName}
      class="flex w-full place-items-center justify-between gap-4 rounded-r-full py-3 transition-[padding] delay-100 duration-100 hover:cursor-pointer hover:bg-immich-gray hover:text-immich-primary dark:text-immich-dark-fg dark:hover:bg-immich-dark-gray dark:hover:text-immich-dark-primary pl-10 group-hover:sm:px-10 md:px-10"
    >
      {#if album.albumThumbnailAssetId}
        <div>
          <div
            class="h-6 w-6 bg-cover rounded"
            style={"background-image:url('" + getAssetThumbnailUrl({ id: album.albumThumbnailAssetId }) + "')"}
          ></div>
        </div>
      {/if}
      <div class="grow text-sm font-medium truncate">
        {album.albumName}
      </div>
    </a>
  {/each}
  <a
    href="/albums"
    aria-label="albums"
    class="flex w-full place-items-center justify-between gap-4 rounded-r-full py-3 transition-[padding] delay-100 duration-100 hover:cursor-pointer hover:bg-immich-gray hover:text-immich-primary dark:text-immich-dark-fg dark:hover:bg-immich-dark-gray dark:hover:text-immich-dark-primary pl-10 group-hover:sm:px-10 md:px-10"
  >
    <div>
      <div class="h-6 w-6 bg-cover rounded"><Icon path={mdiArrowRight}></Icon></div>
    </div>
    <div class="grow text-sm font-medium">Alle Albums bekijken</div>
  </a>
{/if}
