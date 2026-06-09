<script lang="ts">
  import MonthlyBar from './MonthlyBar.svelte';
  import { formatMonth } from '$lib/utils/statistics';
  import { t } from 'svelte-i18n';

  interface Props {
    monthly: Array<{
      year: number;
      month: number;
      count: number;
    }>;
    maxCount: number;
    getSearchUrl: (year: number, month: number) => string;
  }

  let { monthly, maxCount, getSearchUrl }: Props = $props();

  const MONTHS_PER_PAGE = 12;
  let startIndex = $state(0);

  const visibleItems = $derived.by(() => monthly.slice(startIndex, startIndex + MONTHS_PER_PAGE));
  const hasNext = $derived.by(() => startIndex + MONTHS_PER_PAGE < monthly.length);
  const hasPrev = $derived.by(() => startIndex > 0);

  function goBack() {
    startIndex = Math.max(0, startIndex - MONTHS_PER_PAGE);
  }

  function goForward() {
    startIndex = Math.min(monthly.length - MONTHS_PER_PAGE, startIndex + MONTHS_PER_PAGE);
  }
</script>

{#if monthly.length > 0}
  <section
    class="rounded-3xl border border-gray-200/70 bg-light p-6 shadow-sm dark:border-immich-dark-gray dark:bg-immich-dark-bg"
  >
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 class="text-xl font-semibold text-immich-fg dark:text-immich-dark-fg">{$t('photos_per_month')}</h2>
        <p class="mt-1 text-sm text-gray-500 dark:text-immich-dark-fg/75">{$t('statistics')}</p>
      </div>
      <div class="text-sm text-gray-500 dark:text-immich-dark-fg/75">
        {monthly.length}
        {$t('items')}
      </div>
    </div>

    <div class="mt-6">
      {#if monthly.length > 12}
        <div class="mb-4 flex items-center justify-between">
          <button
            type="button"
            onclick={goBack}
            disabled={!hasPrev}
            class="rounded-lg p-2 transition-colors {hasPrev
              ? 'hover:bg-subtle dark:hover:bg-immich-dark-gray'
              : 'cursor-not-allowed opacity-30'}"
            aria-label="View earlier months"
          >
            <svg
              class="size-5 text-immich-fg dark:text-immich-dark-fg"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span class="text-xs text-gray-500 dark:text-immich-dark-fg/75">
            {startIndex + 1}–{Math.min(startIndex + 12, monthly.length)} of {monthly.length}
          </span>
          <button
            type="button"
            onclick={goForward}
            disabled={!hasNext}
            class="rounded-lg p-2 transition-colors {hasNext
              ? 'hover:bg-subtle dark:hover:bg-immich-dark-gray'
              : 'cursor-not-allowed opacity-30'}"
            aria-label="View later months"
          >
            <svg
              class="size-5 text-immich-fg dark:text-immich-dark-fg"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      {/if}

      <div class="grid grid-cols-12 gap-4">
        {#each visibleItems as stat (stat.year + '-' + stat.month)}
          {@const [monthPart, yearPart] = formatMonth(stat.year, stat.month).split(' ')}
          <div class="col-span-1">
            <MonthlyBar
              href={getSearchUrl(stat.year, stat.month)}
              heightPercent={Math.max((stat.count / maxCount) * 100, 4)}
              ariaLabel={`${formatMonth(stat.year, stat.month)}: ${stat.count}`}
            >
              <div class="text-center">
                <p class="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-immich-dark-fg/75">
                  {monthPart}
                </p>
                <p class="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-immich-dark-fg/75">
                  {yearPart}
                </p>
                <p class="text-sm font-semibold text-immich-fg dark:text-immich-dark-fg">
                  {stat.count.toLocaleString()}
                </p>
              </div>
            </MonthlyBar>
          </div>
        {/each}
      </div>
    </div>
  </section>
{/if}
