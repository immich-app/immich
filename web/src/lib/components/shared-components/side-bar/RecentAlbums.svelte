<script lang="ts">
  import { getRecentAlbumsQuery } from '$lib/queries/album.query';
  import { queryClient } from '$lib/queries/client';
  import { Route } from '$lib/route';
  import { getAssetMediaUrl } from '$lib/utils';
  import { createQuery } from '@tanstack/svelte-query';

  const query = createQuery(getRecentAlbumsQuery, () => queryClient);
  const albums = $derived(query.data ?? []);
</script>

{#each albums as album (album.id)}
  <a
    href={Route.viewAlbum(album)}
    title={album.albumName}
    class="flex w-full place-items-center justify-between gap-4 rounded-e-full py-3 ps-10 transition-[padding] delay-100 duration-100 hover:cursor-pointer hover:bg-subtle hover:text-immich-primary group-hover:sm:px-10 md:px-10 dark:text-immich-dark-fg dark:hover:bg-immich-dark-gray dark:hover:text-immich-dark-primary"
  >
    <div>
      <div
        class="size-6 rounded-sm bg-gray-200 bg-cover dark:bg-gray-600"
        style={album.albumThumbnailAssetId
          ? `background-image:url('${getAssetMediaUrl({ id: album.albumThumbnailAssetId })}')`
          : ''}
      ></div>
    </div>
    <div class="grow truncate text-sm font-medium">
      {album.albumName}
    </div>
  </a>
{/each}
