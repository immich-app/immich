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

  let albumStats: AlbumStatisticsResponseDto = $state({ owned: 0, shared: 0, notShared: 0 });

  const getUsage = async () => {
    [timelineStats, favoriteStats, archiveStats, trashStats, albumStats] = await Promise.all([
      getAssetStatistics({ visibility: AssetVisibility.Timeline }),
      getAssetStatistics({ isFavorite: true }),
      getAssetStatistics({ visibility: AssetVisibility.Archive }),
      getAssetStatistics({ isTrashed: true }),
      getAlbumStatistics(),
    ]);
  };

  // Upload Activity (heatmap)
  type Day = { date: string; count: number };

  
  let days   = $state([] as Day[]);
  let maxCount = $state(1);
  let weeks  = $state([] as Day[][]);

  // Default range: last 52 weeks (end is exclusive)
  const today = new Date();
  const end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + 1));
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 7 * 52);

  // Align start to Sunday (7 rows x ~52 cols)
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

  async function loadActivity() {
    const params = new URLSearchParams({
      from: toISODate(start),
      to: toISODate(end),
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    });

    // NOTE: expects a backend route at /api/users/me/activity
    const res = await fetch(`/api/users/me/activity?${params.toString()}`);
    const data: Day[] = await res.json();

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

<!-- Heatmap section -->
<section class="my-6">
  <h3 class="text-sm font-medium text-primary dark:text-white mb-2">Upload Activity (last 52 weeks)</h3>

  {#if weeks && weeks.length}
    <div class="heatmap" aria-label="Upload activity heatmap">
      {#each weeks as column}
        {#each column as day}
          <div class="cell b{bucket(day.count)}" title="{day.date}: {day.count} upload(s)"></div>
        {/each}
      {/each}
    </div>

    <div class="legend mt-2">
      <span class="b0" title="0"></span>
      <span class="b1" title="low"></span>
      <span class="b2" title="medium"></span>
      <span class="b3" title="high"></span>
      <span class="b4" title="very high"></span>
    </div>
  {:else}
    <p class="text-sm text-subtle">No uploads yet.</p>
  {/if}
</section>

<style>
  .heatmap {
    display: grid;
    grid-auto-flow: column;
    grid-template-rows: repeat(7, 12px);
    grid-auto-columns: 12px;
    gap: 1px;
  }
  .cell {
    width: 10px;
    height: 10px;
    border-radius: 1px;
  }
  /* 5 levels (0..4). Adjust colors to match your theme tokens if you like. */
  .b0 { background: var(--gray-3, #e9ecef); }
  .b1 { background: #cdeac0; }
  .b2 { background: #9bd18f; }
  .b3 { background: #5fbf5b; }
  .b4 { background: #2f9445; }
  .legend { display: flex; align-items: center; gap: 6px; font-size: 12px; opacity: 0.8; }
  .legend span { width: 12px; height: 12px; border-radius: 2px; display: inline-block; }
</style>
