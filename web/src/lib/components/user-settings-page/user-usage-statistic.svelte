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
    [timelineStats, favoriteStats, archiveStats, trashStats, albumStats] = await Promise.all([
      getAssetStatistics({ isArchived: false }),
      getAssetStatistics({ isFavorite: true }),
      getAssetStatistics({ isArchived: true }),
      getAssetStatistics({ isTrashed: true }),
      getAlbumStatistics(),
    ]);
  };

  onMount(async () => {
    await getUsage();
  });
</script>

{#snippet row(viewName: string, imageCount: number, videoCount: number, totalCount: number)}
  <td class="w-1/4 text-ellipsis px-4 text-sm">{viewName}</td>
  <td class="w-1/4 text-ellipsis px-4 text-sm">{imageCount}</td>
  <td class="flex flex-row flex-wrap justify-center gap-x-2 gap-y-1 w-1/4"> {videoCount}</td>
  <td class="flex flex-row flex-wrap justify-center gap-x-2 gap-y-1 w-1/4"> {totalCount}</td>
{/snippet}

<section class="my-6">
  <p class="text-xs dark:text-white uppercase">{$t('photos_and_videos')}</p>
  <table class="w-full text-left mt-4">
    <thead
      class="mb-4 flex h-12 w-full rounded-md border bg-gray-50 text-immich-primary dark:border-immich-dark-gray dark:bg-immich-dark-gray dark:text-immich-dark-primary"
    >
      <tr class="flex w-full place-items-center">
        <th class="w-1/4 text-center text-sm font-medium">{$t('view').toLocaleString()}</th>
        <th class="w-1/4 text-center text-sm font-medium">{$t('photos').toLocaleString()}</th>
        <th class="w-1/4 text-center text-sm font-medium">{$t('videos').toLocaleString()}</th>
        <th class="w-1/4 text-center text-sm font-medium">{$t('total').toLocaleString()}</th>
      </tr>
    </thead>
    <tbody class="block w-full overflow-y-auto rounded-md border dark:border-immich-dark-gray">
      <tr
        class="flex h-[60px] w-full place-items-center text-center dark:text-immich-dark-fg bg-immich-bg dark:bg-immich-dark-gray/50"
      >
        {@render row($t('timeline'), timelineStats.images, timelineStats.videos, timelineStats.total)}
      </tr>

      <tr
        class="flex h-[60px] w-full place-items-center text-center dark:text-immich-dark-fg bg-immich-gray dark:bg-immich-dark-gray/75"
      >
        {@render row($t('favorites'), favoriteStats.images, favoriteStats.videos, favoriteStats.total)}
      </tr>

      <tr
        class="flex h-[60px] w-full place-items-center text-center dark:text-immich-dark-fg bg-immich-bg dark:bg-immich-dark-gray/50"
      >
        {@render row($t('archive'), archiveStats.images, archiveStats.videos, archiveStats.total)}
      </tr>

      <tr
        class="flex h-[60px] w-full place-items-center text-center dark:text-immich-dark-fg bg-immich-gray dark:bg-immich-dark-gray/75"
      >
        {@render row($t('trash'), trashStats.images, trashStats.videos, trashStats.total)}
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
        class="flex h-[60px] w-full place-items-center text-center dark:text-immich-dark-fg bg-immich-bg dark:bg-immich-dark-gray/50"
      >
        <td class="w-1/2 text-ellipsis px-4 text-sm"> {albumStats.owned.toLocaleString()}</td>
        <td class="w-1/2 text-ellipsis px-4 text-sm">{albumStats.shared.toLocaleString()}</td>
      </tr>
    </tbody>
  </table>
</section>
