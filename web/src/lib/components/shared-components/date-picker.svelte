<script lang="ts">
  import { Button } from '@immich/ui';
  import { t } from 'svelte-i18n';

  interface Props {
    onDateChange: (year?: number, month?: number, day?: number) => Promise<void>;
    onClearFilters?: () => void;
    defaultDate?: string;
  }

  let { onDateChange, onClearFilters, defaultDate }: Props = $props();

  let selectedYear = $state<number | undefined>(undefined);
  let selectedMonth = $state<number | undefined>(undefined);
  let selectedDay = $state<number | undefined>(undefined);

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 30 }, (_, i) => currentYear - i);

  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: new Date(2000, i).toLocaleString('default', { month: 'long' }),
  }));

  const dayOptions = $derived.by(() => {
    if (!selectedYear || !selectedMonth) {
      return [];
    }
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  });

  if (defaultDate) {
    const [year, month, day] = defaultDate.split('-');
    selectedYear = Number.parseInt(year);
    selectedMonth = Number.parseInt(month);
    selectedDay = Number.parseInt(day);
  }

  const filterAssetsByDate = async () => {
    await onDateChange(selectedYear, selectedMonth, selectedDay);
  };

  const clearFilters = () => {
    selectedYear = undefined;
    selectedMonth = undefined;
    selectedDay = undefined;
    if (onClearFilters) {
      onClearFilters();
    }
  };
</script>

<div class="mt-2 mb-2 p-2 rounded-lg">
  <div class="flex flex-wrap gap-4 items-end w-136">
    <div class="flex-1 min-w-20">
      <label for="year-select" class="immich-form-label">
        {$t('year')}
      </label>
      <select
        id="year-select"
        bind:value={selectedYear}
        onchange={filterAssetsByDate}
        class="text-sm w-full mt-1 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
      >
        <option value={undefined}>{$t('year')}</option>
        {#each yearOptions as year (year)}
          <option value={year}>{year}</option>
        {/each}
      </select>
    </div>

    <div class="flex-2 min-w-24">
      <label for="month-select" class="immich-form-label">
        {$t('month')}
      </label>
      <select
        id="month-select"
        bind:value={selectedMonth}
        onchange={filterAssetsByDate}
        disabled={!selectedYear}
        class="text-sm w-full mt-1 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:bg-gray-400"
      >
        <option value={undefined}>{$t('month')}</option>
        {#each monthOptions as month (month.value)}
          <option value={month.value}>{month.label}</option>
        {/each}
      </select>
    </div>

    <div class="flex-1 min-w-16">
      <label for="day-select" class="immich-form-label">
        {$t('day')}
      </label>
      <select
        id="day-select"
        bind:value={selectedDay}
        onchange={filterAssetsByDate}
        disabled={!selectedYear || !selectedMonth}
        class="text-sm w-full mt-1 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:bg-gray-400"
      >
        <option value={undefined}>{$t('day')}</option>
        {#each dayOptions as day (day)}
          <option value={day}>{day}</option>
        {/each}
      </select>
    </div>

    <div class="flex">
      <Button size="small" color="secondary" variant="ghost" onclick={clearFilters}>{$t('reset')}</Button>
    </div>
  </div>
</div>
