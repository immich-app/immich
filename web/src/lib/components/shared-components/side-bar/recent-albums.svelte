<script lang="ts">
  import { onMount } from 'svelte';
  import { getAssetThumbnailUrl } from '$lib/utils';
  import { getAllAlbums, type AlbumResponseDto } from '@immich/sdk';
  import { handleError } from '$lib/utils/handle-error';
  import { t } from 'svelte-i18n';
  import { userInteraction } from '$lib/stores/user.svelte';

  let albums: AlbumResponseDto[] = $state([]);

  onMount(async () => {
    if (userInteraction.recentAlbums) {
      albums = userInteraction.recentAlbums;
      return;
    }
    try {
      const allAlbums = await getAllAlbums({});
      albums = allAlbums.sort((a, b) => (a.updatedAt > b.updatedAt ? -1 : 1)).slice(0, 3);
      userInteraction.recentAlbums = albums;
    } catch (error) {
      handleError(error, $t('failed_to_load_assets'));
    }
  });
</script>

{#each albums as album (album.id)}
  <a
    href={'/albums/' + album.id}
    title={album.albumName}
    class="flex w-full place-items-center justify-between gap-4 rounded-e-full py-3 transition-[padding] delay-100 duration-100 hover:cursor-pointer hover:bg-immich-gray hover:text-immich-primary dark:text-immich-dark-fg dark:hover:bg-immich-dark-gray dark:hover:text-immich-dark-primary ps-10 group-hover:sm:px-10 md:px-10"
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
