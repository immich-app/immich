<script lang="ts">
  import { onMount } from 'svelte';
  import UserPageLayout from '$lib/components/layouts/UserPageLayout.svelte';
  import { AssetMediaSize } from '@immich/sdk';
  import { getAssetMediaUrl } from '$lib/utils';
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import { mdiChartLine, mdiDownload, mdiTrophy, mdiCalendarRange } from '@mdi/js';
  import { Icon } from '@immich/ui';
  import { t } from 'svelte-i18n';

  type TopAsset = { assetId: string; count: number };
  type TimeBucket = { bucket: string; count: number };
  type Overview = { total: number; top: TopAsset[]; series: TimeBucket[] };

  let total = $state(0);
  let top = $state<TopAsset[]>([]);
  let series = $state<TimeBucket[]>([]);
  let sinceDays = $state(30);
  let granularity = $state<'day' | 'week' | 'month'>('day');
  let loading = $state(true);

  // Plain fetch — works without regenerating the SDK. Once `make open-api` is run,
  // you can switch this for `getDownloadOverview()` etc.
  async function api<T>(path: string): Promise<T> {
    const params = new URLSearchParams(authManager.params as Record<string, string>);
    const sep = path.includes('?') ? '&' : '?';
    const res = await fetch(`/api${path}${params.toString() ? sep + params.toString() : ''}`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error(`API error ${res.status}`);
    return (await res.json()) as T;
  }

  async function load() {
    loading = true;
    try {
      const overview = await api<Overview>('/stats/downloads/overview');
      total = overview.total;
      top = overview.top;

      const seriesData = await api<{ bucket: string; count: number }[]>(
        `/stats/downloads/timeseries?sinceDays=${sinceDays}&granularity=${granularity}`,
      );
      series = seriesData;

      const topData = await api<TopAsset[]>(`/stats/downloads/top?sinceDays=${sinceDays}&limit=10`);
      top = topData;
    } finally {
      loading = false;
    }
  }

  onMount(load);

  // SVG sparkline-style bar chart — no external chart lib required
  let chartW = 720;
  let chartH = 240;
  const chartPad = { top: 16, right: 16, bottom: 28, left: 32 };
  let maxCount = $derived(Math.max(1, ...series.map((s) => s.count)));
  let barWidth = $derived(
    series.length > 0 ? (chartW - chartPad.left - chartPad.right) / series.length : 0,
  );

  const fmtDate = (s: string) => {
    const d = new Date(s);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const thumbUrl = (id: string) => getAssetMediaUrl({ id, size: AssetMediaSize.Thumbnail });
</script>

<UserPageLayout title={$t('statistics')}>
  <section class="p-4 grid gap-4">
    <!-- KPI cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="rounded-2xl bg-gray-50 dark:bg-immich-dark-gray p-6 shadow-sm">
        <div class="flex items-center gap-3">
          <Icon icon={mdiDownload} size="2em" />
          <div>
            <div class="text-3xl font-bold">{total}</div>
            <div class="text-sm opacity-70">Téléchargements totaux</div>
          </div>
        </div>
      </div>
      <div class="rounded-2xl bg-gray-50 dark:bg-immich-dark-gray p-6 shadow-sm">
        <div class="flex items-center gap-3">
          <Icon icon={mdiTrophy} size="2em" />
          <div>
            <div class="text-3xl font-bold">{top.length}</div>
            <div class="text-sm opacity-70">Images dans le top</div>
          </div>
        </div>
      </div>
      <div class="rounded-2xl bg-gray-50 dark:bg-immich-dark-gray p-6 shadow-sm">
        <div class="flex items-center gap-3">
          <Icon icon={mdiCalendarRange} size="2em" />
          <div>
            <div class="text-3xl font-bold">{sinceDays}j</div>
            <div class="text-sm opacity-70">Période analysée</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap gap-3 items-center text-sm">
      <label class="flex items-center gap-2">
        Période :
        <select
          bind:value={sinceDays}
          onchange={load}
          class="rounded p-1 border bg-transparent dark:border-immich-dark-gray"
        >
          <option value={7}>7 jours</option>
          <option value={30}>30 jours</option>
          <option value={90}>90 jours</option>
          <option value={365}>1 an</option>
        </select>
      </label>
      <label class="flex items-center gap-2">
        Granularité :
        <select
          bind:value={granularity}
          onchange={load}
          class="rounded p-1 border bg-transparent dark:border-immich-dark-gray"
        >
          <option value="day">Jour</option>
          <option value="week">Semaine</option>
          <option value="month">Mois</option>
        </select>
      </label>
    </div>

    <!-- Chart -->
    <div class="rounded-2xl bg-gray-50 dark:bg-immich-dark-gray p-6 shadow-sm">
      <h2 class="text-lg font-semibold mb-3 flex items-center gap-2">
        <Icon icon={mdiChartLine} size="1.2em" />
        Évolution des téléchargements
      </h2>
      {#if loading}
        <p class="opacity-70">Chargement…</p>
      {:else if series.length === 0}
        <p class="opacity-70">Aucun téléchargement sur la période.</p>
      {:else}
        <svg viewBox={`0 0 ${chartW} ${chartH}`} class="w-full h-auto" role="img" aria-label="Graphique des téléchargements">
          <!-- y axis grid (4 lines) -->
          {#each [0, 0.25, 0.5, 0.75, 1] as r}
            {@const y = chartPad.top + (chartH - chartPad.top - chartPad.bottom) * (1 - r)}
            <line x1={chartPad.left} y1={y} x2={chartW - chartPad.right} y2={y} stroke="currentColor" stroke-opacity="0.1" />
            <text x={chartPad.left - 4} y={y + 4} text-anchor="end" font-size="10" fill="currentColor" opacity="0.6">
              {Math.round(maxCount * r)}
            </text>
          {/each}
          <!-- bars -->
          {#each series as s, i}
            {@const h = ((chartH - chartPad.top - chartPad.bottom) * s.count) / maxCount}
            {@const x = chartPad.left + i * barWidth + 1}
            {@const y = chartH - chartPad.bottom - h}
            <rect {x} {y} width={Math.max(1, barWidth - 2)} height={h} fill="#4250af" rx="2">
              <title>{fmtDate(s.bucket)}: {s.count}</title>
            </rect>
            {#if i % Math.ceil(series.length / 8 || 1) === 0}
              <text
                x={x + barWidth / 2}
                y={chartH - chartPad.bottom + 14}
                text-anchor="middle"
                font-size="10"
                fill="currentColor"
                opacity="0.6"
              >
                {fmtDate(s.bucket)}
              </text>
            {/if}
          {/each}
        </svg>
      {/if}
    </div>

    <!-- Top images grid -->
    <div class="rounded-2xl bg-gray-50 dark:bg-immich-dark-gray p-6 shadow-sm">
      <h2 class="text-lg font-semibold mb-3 flex items-center gap-2">
        <Icon icon={mdiTrophy} size="1.2em" />
        Top 10 des images les plus téléchargées
      </h2>
      {#if loading}
        <p class="opacity-70">Chargement…</p>
      {:else if top.length === 0}
        <p class="opacity-70">Aucun téléchargement sur la période.</p>
      {:else}
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {#each top as item, i (item.assetId)}
            <a href={`/photos/${item.assetId}`} class="block group">
              <div class="relative aspect-square overflow-hidden rounded-lg bg-black/10">
                <img
                  src={thumbUrl(item.assetId)}
                  alt=""
                  class="w-full h-full object-cover transition group-hover:scale-105"
                  loading="lazy"
                />
                <span class="absolute top-1 left-1 bg-black/70 text-white text-xs px-2 py-0.5 rounded">
                  #{i + 1}
                </span>
                <span class="absolute bottom-1 right-1 bg-immich-primary text-white text-xs px-2 py-0.5 rounded">
                  {item.count} ⬇
                </span>
              </div>
            </a>
          {/each}
        </div>
      {/if}
    </div>
  </section>
</UserPageLayout>
