<script lang="ts">
  import { locale } from '$lib/stores/preferences.store';
  import {
    AssetVisibility,
    getAlbumStatistics,
    getAssetStatistics,
    type AlbumStatisticsResponseDto,
    type AssetStatsResponseDto,
  } from '@immich/sdk';
  import { Heading, Table, TableBody, TableCell, TableHeader, TableHeading, TableRow } from '@immich/ui';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';

  type UserUploadStatsResponseDto = {
    userId: string;
    from: string;
    to: string;
    series: Array<{ date: string; count: number }>;
    summary: { totalCount: number };
  };

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

  let uploadStats: UserUploadStatsResponseDto = $state({
    userId: '',
    from: '',
    to: '',
    series: [],
    summary: { totalCount: 0 },
  });

  const formatDate = (date: Date) => date.toISOString().slice(0, 10);
  const today = new Date();
  const uploadActivityTo = formatDate(today);
  const uploadActivityFromDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  uploadActivityFromDate.setUTCDate(uploadActivityFromDate.getUTCDate() - 52 * 7 + 1);
  const uploadActivityFrom = formatDate(uploadActivityFromDate);

  const getMyUploadStatistics = async (from: string, to: string) => {
    const response = await fetch(`/api/users/me/stats/uploads?${new URLSearchParams({ from, to })}`);
    return (await response.json()) as UserUploadStatsResponseDto;
  };

  const getUsage = async () => {
    [timelineStats, favoriteStats, archiveStats, trashStats, albumStats, uploadStats] = await Promise.all([
      getAssetStatistics({ visibility: AssetVisibility.Timeline }),
      getAssetStatistics({ isFavorite: true }),
      getAssetStatistics({ visibility: AssetVisibility.Archive }),
      getAssetStatistics({ isTrashed: true }),
      getAlbumStatistics(),
      getMyUploadStatistics(uploadActivityFrom, uploadActivityTo),
    ]);
  };

  const getUploadActivityWeeks = () => {
    const days = uploadStats.series.map((item) => ({ ...item, dateValue: new Date(`${item.date}T00:00:00.000Z`) }));
    return Array.from({ length: Math.ceil(days.length / 7) }, (_, index) => days.slice(index * 7, index * 7 + 7));
  };

  const getUploadActivityLevel = (count: number) => {
    const maxCount = Math.max(...uploadStats.series.map((item) => item.count), 0);

    if (count === 0 || maxCount === 0) {
      return 'bg-gray-200 dark:bg-gray-700';
    }

    if (count <= Math.ceil(maxCount * 0.25)) {
      return 'bg-immich-primary/30';
    }

    if (count <= Math.ceil(maxCount * 0.5)) {
      return 'bg-immich-primary/50';
    }

    if (count <= Math.ceil(maxCount * 0.75)) {
      return 'bg-immich-primary/70';
    }

    return 'bg-immich-primary';
  };

  const getUploadActivityMonths = () => {
    const endDate = uploadStats.to ? new Date(`${uploadStats.to}T00:00:00.000Z`) : today;
    return Array.from({ length: 12 }, (_, index) => {
      const monthDate = new Date(Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth() - 11 + index, 1));
      return monthDate.toLocaleString($locale, { month: 'short', timeZone: 'UTC' });
    });
  };

  onMount(async () => {
    await getUsage();
  });
</script>

{#snippet row(viewName: string, stats: AssetStatsResponseDto)}
  <TableRow>
    <TableCell class="w-1/4">{viewName}</TableCell>
    <TableCell class="w-1/4">{stats.images.toLocaleString($locale)}</TableCell>
    <TableCell class="w-1/4">{stats.videos.toLocaleString($locale)}</TableCell>
    <TableCell class="w-1/4">{stats.total.toLocaleString($locale)}</TableCell>
  </TableRow>
{/snippet}

<section class="my-4 w-full">
  <Heading size="tiny">{$t('photos_and_videos')}</Heading>
  <Table striped spacing="small" class="mt-4" size="small">
    <TableHeader>
      <TableHeading class="w-1/4">{$t('view_name')}</TableHeading>
      <TableHeading class="w-1/4">{$t('photos')}</TableHeading>
      <TableHeading class="w-1/4">{$t('videos')}</TableHeading>
      <TableHeading class="w-1/4">{$t('total')}</TableHeading>
    </TableHeader>
    <TableBody>
      {@render row($t('timeline'), timelineStats)}
      {@render row($t('favorites'), favoriteStats)}
      {@render row($t('archive'), archiveStats)}
      {@render row($t('trash'), trashStats)}
    </TableBody>
  </Table>

  <Heading size="tiny" class="mt-8">{$t('albums')}</Heading>
  <Table striped spacing="small" class="mt-4" size="small">
    <TableHeader>
      <TableHeading class="w-1/2">{$t('owned')}</TableHeading>
      <TableHeading class="w-1/2">{$t('shared')}</TableHeading>
    </TableHeader>
    <TableBody>
      <TableRow>
        <TableCell class="w-1/2">{albumStats.owned.toLocaleString($locale)}</TableCell>
        <TableCell class="w-1/2">{albumStats.shared.toLocaleString($locale)}</TableCell>
      </TableRow>
    </TableBody>
  </Table>

  <Heading size="tiny" class="mt-8">Upload activity</Heading>
  <div class="mt-4 w-full">
    <div class="w-full">
      <div class="mb-1 ml-7 flex justify-between text-xs text-gray-500 dark:text-gray-400">
        {#each getUploadActivityMonths() as month}
          <div>{month}</div>
        {/each}
      </div>

      <div class="flex gap-1">
        <div class="grid w-6 shrink-0 grid-rows-7 gap-px py-0.5 text-xs text-gray-500 sm:gap-1 dark:text-gray-400">
          <div></div>
          <div>Mon</div>
          <div></div>
          <div>Wed</div>
          <div></div>
          <div>Fri</div>
          <div></div>
        </div>

        <div class="grid flex-1 grid-cols-[repeat(52,minmax(0,1fr))] gap-px sm:gap-1">
          {#each getUploadActivityWeeks() as week}
            <div class="grid grid-rows-7 gap-px sm:gap-1">
              {#each week as day}
                <div
                  class={`aspect-square w-full min-w-0 rounded-sm ${getUploadActivityLevel(day.count)}`}
                  title={`${day.date}: ${day.count.toLocaleString($locale)} uploads`}
                  aria-label={`${day.date}: ${day.count.toLocaleString($locale)} uploads`}
                ></div>
              {/each}
            </div>
          {/each}
        </div>
      </div>

      <div class="mt-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
        <span>Less</span>
        <span class="size-3 rounded-sm bg-gray-200 dark:bg-gray-700"></span>
        <span class="size-3 rounded-sm bg-immich-primary/30"></span>
        <span class="size-3 rounded-sm bg-immich-primary/50"></span>
        <span class="size-3 rounded-sm bg-immich-primary/70"></span>
        <span class="size-3 rounded-sm bg-immich-primary"></span>
        <span>More</span>
        <span class="ml-4">{uploadStats.summary.totalCount.toLocaleString($locale)} uploads</span>
      </div>
    </div>
  </div>
</section>
