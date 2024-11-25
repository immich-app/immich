<script lang="ts">
  import {
    getAlbumStatistics,
    getAssetStatistics,
    type AlbumStatisticsResponseDto,
    type AssetStatsResponseDto,
  } from '@immich/sdk';
  import { onMount } from 'svelte';

  let timelineStats: AssetStatsResponseDto = $state({
    videos: 0,
    images: 0,
    total: 0,
  });

  let favoriteStats: AssetStatsResponseDto = $state({
    videos: 0,
    images: 0,
    total: 0,
  });

  let archiveStats: AssetStatsResponseDto = $state({
    videos: 0,
    images: 0,
    total: 0,
  });

  let trashStats: AssetStatsResponseDto = $state({
    videos: 0,
    images: 0,
    total: 0,
  });

  let albumStats: AlbumStatisticsResponseDto = $state({
    owned: 0,
    shared: 0,
    notShared: 0,
  });

  const getUsage = async () => {
    const [timeline, favorite, archive, trash] = await Promise.all([
      getAssetStatistics({ isArchived: false }),
      getAssetStatistics({ isFavorite: true }),
      getAssetStatistics({ isArchived: true }),
      getAssetStatistics({ isTrashed: true }),
    ]);

    timelineStats = timeline;
    favoriteStats = favorite;
    archiveStats = archive;
    trashStats = trash;

    albumStats = await getAlbumStatistics();
  };

  onMount(async () => {
    await getUsage();
  });
</script>

<section class="my-6">
  <p class="text-xs dark:text-white">PHOTOS AND VIDEOS</p>
  <table class="w-full text-left mt-4">
    <thead
      class="mb-4 flex h-12 w-full rounded-md border bg-gray-50 text-immich-primary dark:border-immich-dark-gray dark:bg-immich-dark-gray dark:text-immich-dark-primary"
    >
      <tr class="flex w-full place-items-center">
        <th class="w-1/3 text-center text-sm font-medium">View</th>
        <th class="w-1/3 text-center text-sm font-medium">Photos</th>
        <th class="w-1/3 text-center text-sm font-medium">Video</th>
        <th class="w-1/3 text-center text-sm font-medium">Total</th>
      </tr>
    </thead>
    <tbody class="block w-full overflow-y-auto rounded-md border dark:border-immich-dark-gray">
      <tr
        class={`flex h-[60px] w-full place-items-center text-center dark:text-immich-dark-fg bg-immich-bg dark:bg-immich-dark-gray/50`}
      >
        <td class="w-1/3 text-ellipsis px-4 text-sm">Timeline</td>
        <td class="w-1/3 text-ellipsis px-4 text-sm">{timelineStats.images}</td>
        <td class="flex flex-row flex-wrap justify-center gap-x-2 gap-y-1 w-1/3"> {timelineStats.videos}</td>
        <td class="flex flex-row flex-wrap justify-center gap-x-2 gap-y-1 w-1/3"> {timelineStats.total}</td>
      </tr>

      <tr
        class={`flex h-[60px] w-full place-items-center text-center dark:text-immich-dark-fg bg-immich-gray dark:bg-immich-dark-gray/75`}
      >
        <td class="w-1/3 text-ellipsis px-4 text-sm">Favorites</td>
        <td class="w-1/3 text-ellipsis px-4 text-sm">{favoriteStats.images}</td>
        <td class="flex flex-row flex-wrap justify-center gap-x-2 gap-y-1 w-1/3"> {favoriteStats.videos}</td>
        <td class="flex flex-row flex-wrap justify-center gap-x-2 gap-y-1 w-1/3"> {favoriteStats.total}</td>
      </tr>

      <tr
        class={`flex h-[60px] w-full place-items-center text-center dark:text-immich-dark-fg bg-immich-bg dark:bg-immich-dark-gray/50`}
      >
        <td class="w-1/3 text-ellipsis px-4 text-sm">Archives</td>
        <td class="w-1/3 text-ellipsis px-4 text-sm">{archiveStats.images}</td>
        <td class="flex flex-row flex-wrap justify-center gap-x-2 gap-y-1 w-1/3"> {archiveStats.videos}</td>
        <td class="flex flex-row flex-wrap justify-center gap-x-2 gap-y-1 w-1/3"> {archiveStats.total}</td>
      </tr>

      <tr
        class={`flex h-[60px] w-full place-items-center text-center dark:text-immich-dark-fg bg-immich-gray dark:bg-immich-dark-gray/75`}
      >
        <td class="w-1/3 text-ellipsis px-4 text-sm">Trash</td>
        <td class="w-1/3 text-ellipsis px-4 text-sm">{trashStats.images}</td>
        <td class="flex flex-row flex-wrap justify-center gap-x-2 gap-y-1 w-1/3"> {trashStats.videos}</td>
        <td class="flex flex-row flex-wrap justify-center gap-x-2 gap-y-1 w-1/3"> {trashStats.total}</td>
      </tr>
    </tbody>
  </table>

  <div class="mt-6">
    <p class="text-xs dark:text-white">ALBUMS</p>
  </div>
  <table class="w-full text-left mt-4">
    <thead
      class="mb-4 flex h-12 w-full rounded-md border bg-gray-50 text-immich-primary dark:border-immich-dark-gray dark:bg-immich-dark-gray dark:text-immich-dark-primary"
    >
      <tr class="flex w-full place-items-center">
        <th class="w-1/3 text-center text-sm font-medium">Owned</th>
        <th class="w-1/3 text-center text-sm font-medium">Shared</th>
        <th class="w-1/3 text-center text-sm font-medium">Not Shared</th>
      </tr>
    </thead>
    <tbody class="block w-full overflow-y-auto rounded-md border dark:border-immich-dark-gray">
      <tr
        class={`flex h-[60px] w-full place-items-center text-center dark:text-immich-dark-fg bg-immich-bg dark:bg-immich-dark-gray/50`}
      >
        <td class="w-1/3 text-ellipsis px-4 text-sm"> {albumStats.owned}</td>
        <td class="w-1/3 text-ellipsis px-4 text-sm">{albumStats.shared}</td>
        <td class="flex flex-row flex-wrap justify-center gap-x-2 gap-y-1 w-1/3"> {albumStats.notShared}</td>
      </tr>
    </tbody>
  </table>
</section>
