<script lang="ts">
  import { locale } from '$lib/stores/preferences.store';
  import type { CalendarHeatmapResponseDto } from '@immich/sdk';
  import { Text } from '@immich/ui';
  import { DateTime, Info } from 'luxon';
  import { t } from 'svelte-i18n';

  type Props = {
    data: CalendarHeatmapResponseDto;
    itemLabel: (item: { date: string; count: number }) => string;
    totalLabel: (count: number) => string;
  };

  const { data, itemLabel, totalLabel }: Props = $props();

  const startDate = $derived(DateTime.fromISO(data.from, { zone: 'utc' }));
  const padding = $derived(startDate.diff(startDate.startOf('week', { useLocaleWeeks: true })).as('days'));

  const maxCount = $derived(Math.max(...data.series.map((item) => item.count), 0));

  const itemColors = (count: number) => {
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

  const weekdays = $derived([
    Info.weekdays('short', { locale: $locale })[0],
    Info.weekdays('short', { locale: $locale })[2],
    Info.weekdays('short', { locale: $locale })[4],
    Info.weekdays('short', { locale: $locale })[6],
  ]);
</script>

<div class="mt-4 w-full">
  <div class="relative w-full">
    <!-- TODO -->
    <!-- <div class="mb-1 flex justify-between text-xs text-gray-500 dark:text-gray-400">
      {#each getUploadActivityMonths() as month (month)}
        <div>{month}</div>
      {/each}
    </div> -->

    <div class="overflow-x-auto pb-1">
      <div class="grid grid-flow-col grid-rows-7 gap-0.5">
        <div class="row-span-7 grid grid-rows-subgrid">
          {#if Info.getStartOfWeek({ locale: $locale }) === 7}
            <div></div>
          {/if}
          <div class="row-span-2 -mt-1"><Text size="tiny" class="mr-0.5 font-mono">{weekdays[0]}</Text></div>
          <div class="row-span-2 -mt-1"><Text size="tiny" class="mr-0.5 font-mono">{weekdays[1]}</Text></div>
          <div class="row-span-2 -mt-1"><Text size="tiny" class="mr-0.5 font-mono">{weekdays[2]}</Text></div>
          {#if Info.getStartOfWeek({ locale: $locale }) === 1}
            <div class="-my-1"><Text size="tiny" class="mr-0.5 font-mono">{weekdays[3]}</Text></div>
          {/if}
        </div>

        {#each data.series as day, idx (day.date)}
          {@const date = DateTime.fromISO(day.date, { zone: 'utc' }).toLocaleString(
            { month: 'short', day: 'numeric' },
            { locale: $locale },
          )}
          <div
            class="aspect-square size-full rounded-sm {itemColors(day.count)} row-start-(--heatmap-row-start)"
            style:--heatmap-row-start={idx === 0 ? padding + 1 : undefined}
            title={itemLabel({ date, count: day.count })}
            aria-label={itemLabel({ date, count: day.count })}
          ></div>
        {/each}
      </div>
    </div>

    <div class="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
      <span>{$t('less')}</span>
      <span class="size-3 rounded-sm bg-gray-200 dark:bg-gray-700"></span>
      <span class="size-3 rounded-sm bg-immich-primary/30"></span>
      <span class="size-3 rounded-sm bg-immich-primary/50"></span>
      <span class="size-3 rounded-sm bg-immich-primary/70"></span>
      <span class="size-3 rounded-sm bg-immich-primary"></span>
      <span>{$t('more')}</span>
      <span class="ml-4">{totalLabel(data.totalCount)}</span>
    </div>
  </div>
</div>
