<script lang="ts">
  import { user } from '$lib/stores/user.store';
  import { userInteraction } from '$lib/stores/user.svelte';
  import { getAssetThumbnailUrl } from '$lib/utils';
  import { handleError } from '$lib/utils/handle-error';
  import { getAllAlbums, type AlbumResponseDto } from '@immich/sdk';
  import { t } from 'svelte-i18n';

  let albums: AlbumResponseDto[] = $state([]);
  let latestRequestId = 0;

  $effect(() => {
    const currentUserId = $user?.id;
    if (!currentUserId) {
      albums = [];
      return;
    }

    if (userInteraction.recentAlbums) {
      albums = userInteraction.recentAlbums;
      return;
    }

    const requestId = ++latestRequestId;

    getAllAlbums({})
      .then((allAlbums) => {
        if (requestId !== latestRequestId) {
          return;
        }
        const recentAlbums = allAlbums.sort((a, b) => (a.updatedAt > b.updatedAt ? -1 : 1)).slice(0, 3);
        albums = recentAlbums;
        userInteraction.recentAlbums = recentAlbums;
      })
      .catch((error) => {
        if (requestId === latestRequestId) {
          handleError(error, $t('failed_to_load_assets'));
        }
      });
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
