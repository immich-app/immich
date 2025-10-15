<script lang="ts">
  import { userInteraction } from '$lib/stores/user.svelte';
  import { getAssetThumbnailUrl } from '$lib/utils';
  import { handleError } from '$lib/utils/handle-error';
  import { getAllAlbums, type AlbumResponseDto } from '@immich/sdk';
  import { t } from 'svelte-i18n';

  let albums: AlbumResponseDto[] = $state([]);

  const loadRecentAlbums = async () => {
    try {
      const allAlbums = await getAllAlbums({});
      // Filter out albums with empty names (newly created albums that haven't been named yet)
      const namedAlbums = allAlbums.filter(album => album.albumName.trim() !== '');
      const recentAlbums = namedAlbums.sort((a, b) => (a.updatedAt > b.updatedAt ? -1 : 1)).slice(0, 3);
      albums = recentAlbums;
      userInteraction.recentAlbums = recentAlbums;
    } catch (error) {
      handleError(error, $t('failed_to_load_assets'));
    }
  };

  $effect(() => {
    if (userInteraction.recentAlbums) {
      // Apply the same filtering to cached albums to ensure consistency
      const filteredCachedAlbums = userInteraction.recentAlbums.filter(album => album.albumName.trim() !== '');
      albums = filteredCachedAlbums;
    } else {
      void loadRecentAlbums();
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
