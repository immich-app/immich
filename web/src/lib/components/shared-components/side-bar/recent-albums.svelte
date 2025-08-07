<script lang="ts">
  import { userInteraction } from '$lib/stores/user.svelte';
  import { websocketEvents } from '$lib/stores/websocket';
  import { getAssetThumbnailUrl } from '$lib/utils';
  import { handleError } from '$lib/utils/handle-error';
  import { getAlbumInfo, getAllAlbums, type AlbumResponseDto } from '@immich/sdk';
  import { onDestroy, onMount } from 'svelte';
  import { t } from 'svelte-i18n';

  let albums: AlbumResponseDto[] = $state([]);
  let allAlbums: AlbumResponseDto[] = $state([]);

  // Handle album deletion via websocket events
  let unsubscribeWebsocket: (() => void) | undefined;

  onMount(async () => {
    if (userInteraction.recentAlbums) {
      albums = userInteraction.recentAlbums;
      return;
    }
    try {
      allAlbums = await getAllAlbums({});
      albums = allAlbums.sort((a, b) => (a.updatedAt > b.updatedAt ? -1 : 1)).slice(0, 3);
      userInteraction.recentAlbums = albums;
    } catch (error) {
      handleError(error, $t('failed_to_load_assets'));
    }
  });

  onMount(() => {
    unsubscribeWebsocket = websocketEvents.on('on_album_delete', (albumId) => {
      // Remove the deleted album from allAlbums
      allAlbums = allAlbums.filter((album) => album.id !== albumId);
      // Update the displayed albums with the filtered and sorted result
      albums = allAlbums.sort((a, b) => (a.updatedAt > b.updatedAt ? -1 : 1)).slice(0, 3);
      userInteraction.recentAlbums = albums;
    });

    // Add listener for album creation
    const unsubscribeCreate = websocketEvents.on('on_album_create', async (albumId) => {
      try {
        // Fetch the newly created album details
        const newAlbum = await getAlbumInfo({ id: albumId });
        // Add the new album to allAlbums
        allAlbums = [newAlbum, ...allAlbums];
        // Update the displayed albums with the new sorted result
        albums = allAlbums.sort((a, b) => (a.updatedAt > b.updatedAt ? -1 : 1)).slice(0, 3);
        userInteraction.recentAlbums = albums;
      } catch (error) {
        console.error('Failed to fetch new album details:', error);
      }
    });

    // Return a combined unsubscribe function
    const originalUnsubscribe = unsubscribeWebsocket;
    unsubscribeWebsocket = () => {
      originalUnsubscribe?.();
      unsubscribeCreate?.();
    };
  });

  onDestroy(() => {
    if (unsubscribeWebsocket) {
      unsubscribeWebsocket();
    }
  });
</script>

{#each albums as album (album.id)}
  <a
    href={'/albums/' + album.id}
    title={album.albumName}
    class="flex w-full place-items-center justify-between gap-4 rounded-e-full py-3 transition-[padding] delay-100 duration-100 hover:cursor-pointer hover:bg-subtle hover:text-immich-primary dark:text-immich-dark-fg dark:hover:bg-immich-dark-gray dark:hover:text-immich-dark-primary ps-10 group-hover:sm:px-10 md:px-10"
  >
    <div>
      <div
        class="h-6 w-6 bg-cover rounded bg-gray-200 dark:bg-gray-600"
        style={album.albumThumbnailAssetId
          ? `background-image:url('${getAssetThumbnailUrl({ id: album.albumThumbnailAssetId })}')`
          : ''}
      ></div>
    </div>
    <div class="grow text-sm font-medium truncate">
      {album.albumName}
    </div>
  </a>
{/each}
