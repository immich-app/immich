<script lang="ts">
  import { formatBytes } from '$lib/utils/statistics';
  import { t } from 'svelte-i18n';

  interface StatisticsSummary {
    storage: Array<{
      type: string;
      size: number;
    }>;
  }

  interface Props {
    statistics: StatisticsSummary;
    storageSegments: Array<{
      type: string;
      size: number;
      start: number;
      end: number;
      color: string;
    }>;
    storageTotal: number;
  }

  let { statistics, storageSegments, storageTotal }: Props = $props();

  const storageGradient = $derived.by(() => {
    let gradient = '';
    for (const segment of storageSegments) {
      gradient += `${segment.color} ${segment.start}% ${segment.end}%,`;
    }
    return gradient + '#1f2937 0% 100%';
  });
</script>

<section
  class="rounded-3xl border border-gray-200/70 bg-light p-6 shadow-sm dark:border-immich-dark-gray dark:bg-immich-dark-bg"
>
  <div class="flex items-center justify-between gap-4">
    <div>
      <h2 class="text-xl font-semibold text-immich-fg dark:text-immich-dark-fg">{$t('storage_breakdown')}</h2>
      <p class="mt-1 text-sm text-gray-500 dark:text-immich-dark-fg/75">
        {$t('photos')} vs {$t('videos')}
      </p>
    </div>
  </div>

  <div class="mt-6 flex justify-center">
    <div
      class="relative aspect-square w-full max-w-xs rounded-full p-4"
      style={`background: conic-gradient(${storageGradient})`}
    >
      <div
        class="absolute inset-6 flex flex-col items-center justify-center rounded-full border border-gray-200/70 bg-white/95 text-center shadow-inner dark:border-subtle dark:bg-immich-dark-bg/95"
      >
        <p class="text-2xl font-semibold text-immich-fg dark:text-immich-dark-fg">{formatBytes(storageTotal)}</p>
        <p class="mt-1 text-xs tracking-wide text-gray-500 uppercase dark:text-immich-dark-fg/75">
          {$t('total_storage')}
        </p>
      </div>
    </div>
  </div>

  <div class="mt-6 space-y-3">
    {#each statistics.storage as entry, index (index)}
      <div
        class="flex items-center justify-between rounded-lg border border-gray-200/70 bg-subtle p-3 dark:border-immich-dark-gray dark:bg-immich-dark-gray/40"
      >
        <div class="flex items-center gap-3">
          <div
            class="size-3 rounded-full"
            style={`background-color: ${storageSegments.find((s) => s.type === entry.type)?.color || '#6b7280'}`}
          ></div>
          <p class="text-sm font-medium text-immich-fg dark:text-immich-dark-fg">{entry.type}</p>
        </div>
        <p class="text-sm font-semibold text-immich-fg dark:text-immich-dark-fg">{formatBytes(entry.size)}</p>
      </div>
    {/each}
  </div>
</section>
