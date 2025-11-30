<script lang="ts">
  import { locale } from '$lib/stores/preferences.store';
  import {
    AssetVisibility,
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
      getAssetStatistics({ visibility: AssetVisibility.Timeline }),
      getAssetStatistics({ isFavorite: true }),
      getAssetStatistics({ visibility: AssetVisibility.Archive }),
      getAssetStatistics({ isTrashed: true }),
      getAlbumStatistics(),
    ]);
  };

  type Day = { date: string; count: number };

  let days    = $state([] as Day[]);
  let maxCount = $state(1);
  let weeks  = $state([] as Day[][]);

  // Default range: last 52 weeks
  const today = new Date();
  const end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + 1));
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 7 * 52);

  while (start.getUTCDay() !== 0) {
    start.setUTCDate(start.getUTCDate() - 1);
  }

  function toISODate(d: Date) {
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(d.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  }

  function bucket(count: number) {
    if (count === 0) return 0;
    const q = maxCount / 4;
    if (count <= q) return 1;
    if (count <= 2 * q) return 2;
    if (count <= 3 * q) return 3;
    return 4;
  }

  const heatmapColors = [
    'bg-[var(--gray-3,#e9ecef)]', // b0
    'bg-[#cdeac0]',               // b1
    'bg-[#9bd18f]',               // b2
    'bg-[#5fbf5b]',               // b3
    'bg-[#2f9445]'                // b4
  ];

  async function loadActivity() {
    const params = new URLSearchParams({
      from: toISODate(start),
      to: toISODate(end),
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    });

    const res = await fetch(`/api/users/me/stats/uploads?${params.toString()}`);
    const json = await res.json();
    const data: Day[] = json.series ?? [];

    days = data;
    maxCount = Math.max(1, ...data.map((d) => d.count));
  }

  $effect(() => {
    if (days.length) {
      const byDate = new Map(days.map((d) => [d.date, d.count]));
      const grid: Day[][] = [];
      const cursor = new Date(start);

      while (cursor < end) {
        const col: Day[] = [];
        for (let i = 0; i < 7; i++) {
          const key = toISODate(cursor);
          col.push({ date: key, count: byDate.get(key) ?? 0 });
          cursor.setUTCDate(cursor.getUTCDate() + 1);
        }
        grid.push(col);
      }
      weeks = grid;
    } else {
      weeks = [];
    }
  });

  onMount(async () => {
    await getUsage();
    await loadActivity();
  });
</script>

{#snippet row(viewName: string, stats: AssetStatsResponseDto)}
  <tr
    class="flex h-14 w-full place-items-center text-center dark:text-immich-dark-fg even:bg-subtle/20 odd:bg-subtle/80"
  >
    <td class="w-1/4 px-4 text-sm">{viewName}</td>
    <td class="w-1/4 px-4 text-sm">{stats.images.toLocaleString($locale)}</td>
    <td class="w-1/4 px-4 text-sm">{stats.videos.toLocaleString($locale)}</td>
    <td class="w-1/4 px-4">{stats.total.toLocaleString($locale)}</td>
  </tr>
{/snippet}

<section class="my-6">
  <p class="text-xs dark:text-white uppercase">{$t('photos_and_videos')}</p>
  <div class="overflow-x-auto">
    <table class="w-full text-start mt-4">
      <thead
        class="mb-4 flex h-12 w-full rounded-md border bg-gray-50 text-primary dark:border-immich-dark-gray dark:bg-immich-dark-gray"
      >
        <tr class="flex w-full place-items-center text-sm font-medium text-center">
          <th class="w-1/4">{$t('view_name')}</th>
          <th class="w-1/4">{$t('photos')}</th>
          <th class="w-1/4">{$t('videos')}</th>
          <th class="w-1/4">{$t('total')}</th>
        </tr>
      </thead>
      <tbody class="block w-full overflow-y-auto rounded-md border dark:border-immich-dark-gray">
        {@render row($t('timeline'), timelineStats)}
        {@render row($t('favorites'), favoriteStats)}
        {@render row($t('archive'), archiveStats)}
        {@render row($t('trash'), trashStats)}
      </tbody>
    </table>
  </div>

  <div class="mt-6">
    <p class="text-xs dark:text-white uppercase">{$t('albums')}</p>
  </div>
  <div class="overflow-x-auto">
    <table class="w-full text-start mt-4">
      <thead class="mb-4 flex h-12 w-full rounded-md border text-primary dark:border-immich-dark-gray bg-subtle">
        <tr class="flex w-full place-items-center text-sm font-medium text-center">
          <th class="w-1/2">{$t('owned')}</th>
          <th class="w-1/2">{$t('shared')}</th>
        </tr>
      </thead>
      <tbody class="block w-full overflow-y-auto rounded-md border dark:border-immich-dark-gray">
        <tr class="flex h-14 w-full place-items-center text-center dark:text-immich-dark-fg bg-subtle/20">
          <td class="w-1/2 px-4 text-sm">{albumStats.owned.toLocaleString($locale)}</td>
          <td class="w-1/2 px-4 text-sm">{albumStats.shared.toLocaleString($locale)}</td>
        </tr>
      </tbody>
    </table>
  </div>
</section>

<section class="my-6">
  <h3 class="text-sm font-medium text-primary dark:text-white mb-2">Upload Activity (last 52 weeks)</h3>

  {#if weeks && weeks.length}
    <div class="w-full rounded-md border dark:border-immich-dark-gray bg-subtle/20 p-4 overflow-x-auto">
      <div class="flex flex-row justify-between w-full gap-[1px]" aria-label="Upload activity heatmap">
        {#each weeks as column}
          <div class="flex flex-col gap-[1px]">
            {#each column as day}
              <div 
                class="w-2.5 h-2.5 rounded-[2px] {heatmapColors[bucket(day.count)]}" 
                title="{day.date}: {day.count} upload(s)"
              ></div>
            {/each}
          </div>
        {/each}
      </div>

      <div class="flex items-center gap-1.5 mt-3 text-xs opacity-80">
        <span class="w-3 h-3 rounded-[2px] inline-block {heatmapColors[0]}" title="0"></span>
        <span class="w-3 h-3 rounded-[2px] inline-block {heatmapColors[1]}" title="low"></span>
        <span class="w-3 h-3 rounded-[2px] inline-block {heatmapColors[2]}" title="medium"></span>
        <span class="w-3 h-3 rounded-[2px] inline-block {heatmapColors[3]}" title="high"></span>
        <span class="w-3 h-3 rounded-[2px] inline-block {heatmapColors[4]}" title="very high"></span>
      </div>
    </div>
  {:else}
    <p class="text-sm text-subtle">No uploads yet.</p>
  {/if}
</section>