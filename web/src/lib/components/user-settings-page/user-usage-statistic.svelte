<script lang="ts">
  import {
    getAlbumStatistics,
    getAssetStatistics,
    type AlbumStatisticsResponseDto,
    type AssetStatsResponseDto,
  } from '@immich/sdk';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';

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
    [timelineStats, favoriteStats, archiveStats, trashStats] = await Promise.all([
      getAssetStatistics({ isArchived: false }),
      getAssetStatistics({ isFavorite: true }),
      getAssetStatistics({ isArchived: true }),
      getAssetStatistics({ isTrashed: true }),
    ]);

    albumStats = await getAlbumStatistics();
  };

  onMount(async () => {
    await getUsage();
  });
</script>

<section class="my-6">
  <p class="text-xs dark:text-white uppercase">{$t('photo_and_video')}</p>
  <table class="w-full text-left mt-4">
    <thead
      class="mb-4 flex h-12 w-full rounded-md border bg-gray-50 text-immich-primary dark:border-immich-dark-gray dark:bg-immich-dark-gray dark:text-immich-dark-primary"
    >
      <tr class="flex w-full place-items-center">
        <th class="w-1/4 text-center text-sm font-medium">{$t('view')}</th>
        <th class="w-1/4 text-center text-sm font-medium">{$t('photo')}</th>
        <th class="w-1/4 text-center text-sm font-medium">{$t('video')}</th>
        <th class="w-1/4 text-center text-sm font-medium">{$t('total')}</th>
      </tr>
    </thead>
    <tbody class="block w-full overflow-y-auto rounded-md border dark:border-immich-dark-gray">
      <tr
        class={'flex h-[60px] w-full place-items-center text-center dark:text-immich-dark-fg bg-immich-bg dark:bg-immich-dark-gray/50'}
      >
        <td class="w-1/4 text-ellipsis px-4 text-sm">{$t('timeline')}</td>
        <td class="w-1/4 text-ellipsis px-4 text-sm">{timelineStats.images}</td>
        <td class="flex flex-row flex-wrap justify-center gap-x-2 gap-y-1 w-1/4"> {timelineStats.videos}</td>
        <td class="flex flex-row flex-wrap justify-center gap-x-2 gap-y-1 w-1/4"> {timelineStats.total}</td>
      </tr>

      <tr
        class={'flex h-[60px] w-full place-items-center text-center dark:text-immich-dark-fg bg-immich-gray dark:bg-immich-dark-gray/75'}
      >
        <td class="w-1/4 text-ellipsis px-4 text-sm">{$t('favorites')}</td>
        <td class="w-1/4 text-ellipsis px-4 text-sm">{favoriteStats.images}</td>
        <td class="flex flex-row flex-wrap justify-center gap-x-2 gap-y-1 w-1/4"> {favoriteStats.videos}</td>
        <td class="flex flex-row flex-wrap justify-center gap-x-2 gap-y-1 w-1/4"> {favoriteStats.total}</td>
      </tr>

      <tr
        class={'flex h-[60px] w-full place-items-center text-center dark:text-immich-dark-fg bg-immich-bg dark:bg-immich-dark-gray/50'}
      >
        <td class="w-1/4 text-ellipsis px-4 text-sm">{$t('archive')}</td>
        <td class="w-1/4 text-ellipsis px-4 text-sm">{archiveStats.images}</td>
        <td class="flex flex-row flex-wrap justify-center gap-x-2 gap-y-1 w-1/4"> {archiveStats.videos}</td>
        <td class="flex flex-row flex-wrap justify-center gap-x-2 gap-y-1 w-1/4"> {archiveStats.total}</td>
      </tr>

      <tr
        class={'flex h-[60px] w-full place-items-center text-center dark:text-immich-dark-fg bg-immich-gray dark:bg-immich-dark-gray/75'}
      >
        <td class="w-1/4 text-ellipsis px-4 text-sm">{$t('trash')}</td>
        <td class="w-1/4 text-ellipsis px-4 text-sm">{trashStats.images}</td>
        <td class="flex flex-row flex-wrap justify-center gap-x-2 gap-y-1 w-1/4"> {trashStats.videos}</td>
        <td class="flex flex-row flex-wrap justify-center gap-x-2 gap-y-1 w-1/4"> {trashStats.total}</td>
      </tr>
    </tbody>
  </table>

  <div class="mt-6">
    <p class="text-xs dark:text-white uppercase">{$t('albums')}</p>
  </div>
  <table class="w-full text-left mt-4">
    <thead
      class="mb-4 flex h-12 w-full rounded-md border bg-gray-50 text-immich-primary dark:border-immich-dark-gray dark:bg-immich-dark-gray dark:text-immich-dark-primary"
    >
      <tr class="flex w-full place-items-center">
        <th class="w-1/2 text-center text-sm font-medium">{$t('owned')}</th>
        <th class="w-1/2 text-center text-sm font-medium">{$t('shared')}</th>
      </tr>
    </thead>
    <tbody class="block w-full overflow-y-auto rounded-md border dark:border-immich-dark-gray">
      <tr
        class={'flex h-[60px] w-full place-items-center text-center dark:text-immich-dark-fg bg-immich-bg dark:bg-immich-dark-gray/50'}
      >
        <td class="w-1/2 text-ellipsis px-4 text-sm"> {albumStats.owned}</td>
        <td class="w-1/2 text-ellipsis px-4 text-sm">{albumStats.shared}</td>
      </tr>
    </tbody>
  </table>
</section>
