<script lang="ts">
  import { locale } from '$lib/stores/preferences.store';
  import type { CalendarHeatmapResponseDto } from '@immich/sdk';
  import { DateTime } from 'luxon';
  import { t } from 'svelte-i18n';

  type Props = {
    data: CalendarHeatmapResponseDto;
    itemLabel: (item: { date: string; count: number }) => string;
    totalLabel: (count: number) => string;
  };

  const { data, itemLabel, totalLabel }: Props = $props();

  const { rows } = $derived.by(() => {
    const weeks = Array.from({ length: Math.ceil(data.series.length / 7) }, (_, index) =>
      data.series.slice(index * 7, index * 7 + 7),
    );

    const rows = Array.from({ length: 7 }, (_, dayIndex) => weeks.map((week) => week[dayIndex]).filter(Boolean));
    const endDate = DateTime.fromISO(data.to, { zone: 'utc' });

    const months = Array.from({ length: 4 }, (_, index) =>
      endDate.minus({ months: 11 - index * 4 }).toLocaleString({ month: 'short' }, { locale: $locale }),
    );

    return { rows, months };
  });

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

  // const dayLabels = $derived([
  //   '',
  //   dayOfWeek('monday', { locale: $locale, style: 'short' }),
  //   '',
  //   dayOfWeek('wednesday', { locale: $locale, style: 'short' }),
  //   '',
  //   dayOfWeek('friday', { locale: $locale, style: 'short' }),
  //   '',
  // ]);
</script>

<div class="mt-4 w-full">
  <div class="relative w-full">
    <!-- TODO -->
    <!-- <div class="absolute top-4 left-0 flex flex-col gap-0.5">
      {#each dayLabels as dayLabel, i (i)}
        <div class="relative flex h-3 w-6 items-center text-xs text-gray-500 dark:text-gray-400">
          {dayLabel}
        </div>
      {/each}
    </div> -->

    <!-- <div class="mb-1 flex justify-between text-xs text-gray-500 dark:text-gray-400">
      {#each getUploadActivityMonths() as month (month)}
        <div>{month}</div>
      {/each}
    </div> -->

    <div class="grid grid-rows-7 gap-0.5">
      {#each rows as row, dayIndex (dayIndex)}
        <div class="grid grid-cols-52 gap-0.5">
          {#each row as day (day.date)}
            <div
              class="aspect-square w-full min-w-0 rounded-sm {itemColors(day.count)}"
              title={itemLabel({ date: day.date, count: day.count })}
              aria-label={itemLabel({ date: day.date, count: day.count })}
            ></div>
          {/each}
        </div>
      {/each}
    </div>

    <div class="mt-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
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
