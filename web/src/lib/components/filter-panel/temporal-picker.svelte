<script lang="ts">
  import { aggregateYears, getMonthsForYear } from './temporal-utils';

  const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const CUSTOM_RANGE_ERROR_ID = 'custom-date-range-error';

  interface Props {
    timeBuckets: Array<{ timeBucket: string; count: number }>;
    dateAfter?: string;
    dateBefore?: string;
    selectedYear?: number;
    selectedMonth?: number;
    onCustomRangeChange?: (dateAfter?: string, dateBefore?: string) => void;
    onYearSelect?: (year: number | undefined) => void;
    onMonthSelect?: (year: number, month: number | undefined) => void;
  }

  let {
    timeBuckets,
    dateAfter,
    dateBefore,
    selectedYear,
    selectedMonth,
    onCustomRangeChange,
    onYearSelect,
    onMonthSelect,
  }: Props = $props();

  let years = $derived(aggregateYears(timeBuckets));
  let months = $derived(selectedYear === undefined ? [] : getMonthsForYear(timeBuckets, selectedYear));
  let fromValue = $state('');
  let toValue = $state('');
  let customRangeError = $state<string | undefined>();
  let customRangeErrorTarget = $state<'from' | 'to' | 'range' | undefined>();

  $effect(() => {
    fromValue = dateAfter ?? '';
    toValue = dateBefore ?? '';
    clearCustomRangeError();
  });

  function parseDateOnly(value: string): { valid: true; value?: string } | { valid: false } {
    if (value === '') {
      return { valid: true };
    }
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) {
      return { valid: false };
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = new Date(Date.UTC(year, month - 1, day));
    if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
      return { valid: false };
    }

    return { valid: true, value };
  }

  function clearCustomRangeError() {
    customRangeError = undefined;
    customRangeErrorTarget = undefined;
  }

  function clearCustomRangeState() {
    fromValue = '';
    toValue = '';
    clearCustomRangeError();
  }

  function validateAndEmitCustomRange() {
    const parsedFrom = parseDateOnly(fromValue);
    if (!parsedFrom.valid) {
      customRangeError = 'Enter a valid From date';
      customRangeErrorTarget = 'from';
      return;
    }

    const parsedTo = parseDateOnly(toValue);
    if (!parsedTo.valid) {
      customRangeError = 'Enter a valid To date';
      customRangeErrorTarget = 'to';
      return;
    }

    if (parsedFrom.value && parsedTo.value && parsedFrom.value > parsedTo.value) {
      customRangeError = 'From date must be on or before To date';
      customRangeErrorTarget = 'range';
      return;
    }

    clearCustomRangeError();
    onCustomRangeChange?.(parsedFrom.value, parsedTo.value);
  }

  function handleYearClick(year: number, count: number) {
    if (count === 0) {
      return;
    }
    clearCustomRangeState();
    onYearSelect?.(year);
  }

  function handleMonthClick(year: number, month: number, count: number) {
    if (count === 0) {
      return;
    }
    clearCustomRangeState();
    if (selectedMonth === month) {
      // Toggle off: deselect month
      onMonthSelect?.(year, undefined);
    } else {
      onMonthSelect?.(year, month);
    }
  }

  function handleBackToAll() {
    clearCustomRangeState();
    onYearSelect?.(undefined);
  }
</script>

<div data-testid="temporal-picker">
  <div class="mb-4 space-y-2" data-testid="custom-date-range">
    <div class="grid grid-cols-2 gap-2.5">
      <label class="flex flex-col gap-1.5 text-[11px] font-medium leading-none text-gray-600 dark:text-gray-300">
        <span class="px-0.5">From</span>
        <input
          bind:value={fromValue}
          oninput={validateAndEmitCustomRange}
          type="text"
          inputmode="numeric"
          autocomplete="off"
          placeholder="YYYY-MM-DD"
          pattern={String.raw`\d{4}-\d{2}-\d{2}`}
          aria-invalid={customRangeErrorTarget === 'from' || customRangeErrorTarget === 'range' ? 'true' : undefined}
          aria-describedby={customRangeErrorTarget === 'from' || customRangeErrorTarget === 'range'
            ? CUSTOM_RANGE_ERROR_ID
            : undefined}
          class="h-8 w-full rounded-lg border border-gray-200 bg-white px-2.5 text-xs text-gray-700 outline-none transition-colors placeholder:text-gray-400 focus:border-immich-primary dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:focus:border-immich-dark-primary"
          data-testid="custom-date-from-input"
        />
      </label>
      <label class="flex flex-col gap-1.5 text-[11px] font-medium leading-none text-gray-600 dark:text-gray-300">
        <span class="px-0.5">To</span>
        <input
          bind:value={toValue}
          oninput={validateAndEmitCustomRange}
          type="text"
          inputmode="numeric"
          autocomplete="off"
          placeholder="YYYY-MM-DD"
          pattern={String.raw`\d{4}-\d{2}-\d{2}`}
          aria-invalid={customRangeErrorTarget === 'to' || customRangeErrorTarget === 'range' ? 'true' : undefined}
          aria-describedby={customRangeErrorTarget === 'to' || customRangeErrorTarget === 'range'
            ? CUSTOM_RANGE_ERROR_ID
            : undefined}
          class="h-8 w-full rounded-lg border border-gray-200 bg-white px-2.5 text-xs text-gray-700 outline-none transition-colors placeholder:text-gray-400 focus:border-immich-primary dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:focus:border-immich-dark-primary"
          data-testid="custom-date-to-input"
        />
      </label>
    </div>
    {#if customRangeError}
      <p id={CUSTOM_RANGE_ERROR_ID} role="alert" class="text-xs text-red-600 dark:text-red-400">{customRangeError}</p>
    {/if}
  </div>

  {#if selectedYear !== undefined}
    <!-- Breadcrumb -->
    <div class="mb-2 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-300">
      <button
        type="button"
        class="font-medium text-immich-primary hover:underline dark:text-immich-dark-primary"
        onclick={handleBackToAll}
        data-testid="temporal-breadcrumb-all"
      >
        All
      </button>
      <span class="opacity-50">/</span>
      <span class="font-semibold">{selectedYear}</span>
      {#if selectedMonth !== undefined}
        <span class="opacity-50">/</span>
        <span data-testid="temporal-breadcrumb-month" class="font-semibold">{MONTH_LABELS[selectedMonth - 1]}</span>
      {/if}
    </div>

    <!-- Month grid: 4-column CSS grid -->
    <div class="grid grid-cols-4 gap-1.5" data-testid="month-grid">
      {#each months as m (m.month)}
        {@const maxMonthCount = Math.max(...months.map((mo) => mo.count), 1)}
        {@const monthVolume = Math.round((m.count / maxMonthCount) * 100)}
        {@const isSelected = selectedMonth === m.month}
        <button
          type="button"
          class="flex flex-col items-center rounded-lg border px-2 py-2 transition-all duration-100
            {isSelected
            ? 'border-immich-primary bg-immich-primary text-white dark:border-immich-dark-primary dark:bg-immich-dark-primary'
            : m.count === 0
              ? 'cursor-default border-gray-200 opacity-30 dark:border-gray-700'
              : 'cursor-pointer border-gray-200 hover:border-immich-primary hover:bg-immich-primary/5 dark:border-gray-700 dark:hover:border-immich-dark-primary dark:hover:bg-immich-dark-primary/5'}"
          onclick={() => handleMonthClick(selectedYear!, m.month, m.count)}
          data-testid="month-btn-{m.month}"
        >
          <span class="text-xs font-semibold">{m.label}</span>
          <span class="text-xs {isSelected ? 'text-white/80' : 'text-gray-400 dark:text-gray-500'}">{m.count}</span>
          <div
            class="mt-1 h-[3px] w-full overflow-hidden rounded-sm {isSelected
              ? 'bg-white/30'
              : 'bg-gray-200 dark:bg-gray-700'}"
          >
            <div
              class="h-full rounded-sm transition-[width] duration-300 {isSelected
                ? 'bg-white'
                : 'bg-immich-primary dark:bg-immich-dark-primary'}"
              style="width: {m.count === 0 ? 0 : monthVolume}%"
            ></div>
          </div>
        </button>
      {/each}
    </div>
  {:else}
    <!-- Year grid: 4-column flex wrap -->
    <div class="flex flex-wrap gap-1.5" data-testid="year-grid">
      {#each years as y (y.year)}
        <button
          type="button"
          class="year-chip flex min-w-[54px] flex-1 basis-[calc(25%-5px)] flex-col items-center rounded-lg border px-2 py-1.5 transition-all duration-100
            {y.count === 0
            ? 'cursor-default border-gray-200 opacity-30 dark:border-gray-700'
            : 'cursor-pointer border-gray-200 hover:border-immich-primary hover:bg-immich-primary/5 dark:border-gray-700 dark:hover:border-immich-dark-primary dark:hover:bg-immich-dark-primary/5'}"
          onclick={() => handleYearClick(y.year, y.count)}
          data-testid="year-btn-{y.year}"
        >
          <span class="text-xs font-semibold leading-tight">{y.year}</span>
          <span class="text-xs leading-tight text-gray-400 opacity-60 dark:text-gray-500">{y.count}</span>
          <div class="mt-0.5 h-[2px] w-full overflow-hidden rounded-sm bg-gray-200 dark:bg-gray-700">
            <div
              class="h-full rounded-sm bg-immich-primary transition-[width] duration-300 dark:bg-immich-dark-primary"
              style="width: {y.volumePercent}%"
            ></div>
          </div>
        </button>
      {/each}
    </div>
  {/if}
</div>
