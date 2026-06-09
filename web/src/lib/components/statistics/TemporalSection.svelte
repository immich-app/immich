<script lang="ts">
  import TemporalCell from './TemporalCell.svelte';
  import { formatHour } from '$lib/utils/statistics';
  import { t } from 'svelte-i18n';

  interface Props {
    temporalTotal: number;
    temporalRows: Array<{
      dayOfWeek: number;
      label: string;
      cells: Array<{
        hour: number;
        count: number;
        intensity: number;
      }>;
    }>;
    hourLabels: number[];
    temporalPersona: { title?: string; description?: string } | null;
    getSearchUrl: (dayOfWeek?: number, hour?: number) => string;
  }

  let { temporalTotal, temporalRows, hourLabels, temporalPersona, getSearchUrl }: Props = $props();
</script>

{#if temporalTotal > 0}
  <section
    class="rounded-3xl border border-gray-200/70 bg-light p-6 shadow-sm dark:border-immich-dark-gray dark:bg-immich-dark-bg"
  >
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div class="self-start">
        <h2 class="text-xl font-semibold text-immich-fg dark:text-immich-dark-fg">
          {$t('statistics_temporal_matrix_title')}
        </h2>
        <p class="mt-1 text-sm text-gray-500 dark:text-immich-dark-fg/75">
          {$t('statistics_temporal_matrix_description')}
        </p>
      </div>

      {#if temporalPersona}
        <div
          class="rounded-2xl border border-gray-200/70 bg-subtle px-4 py-3 dark:border-immich-dark-gray dark:bg-immich-dark-gray"
        >
          <p class="text-[11px] font-semibold tracking-[0.24em] text-gray-500 uppercase dark:text-immich-dark-fg/75">
            {$t('statistics_temporal_persona_label')}
          </p>
          <p class="mt-1 text-sm font-semibold text-immich-fg dark:text-immich-dark-fg">
            {temporalPersona.title}
          </p>
          <p class="mt-1 max-w-xs text-xs text-gray-500 dark:text-immich-dark-fg/75">
            {temporalPersona.description}
          </p>
        </div>
      {/if}
    </div>

    <div class="mt-6 overflow-x-auto">
      <div class="min-w-4xl space-y-2">
        <div class="grid grid-cols-[4.5rem_repeat(24,minmax(0,1fr))] gap-1">
          <div></div>
          {#each hourLabels as hour (hour)}
            <a
              href={getSearchUrl(undefined, hour)}
              class="flex h-6 items-center justify-center rounded-md text-center text-[10px] font-semibold tracking-wide text-gray-500 uppercase transition-colors hover:text-primary dark:text-immich-dark-fg/75"
              aria-label={$t('statistics_filter_by', { values: { value: formatHour(hour) } })}
              title={$t('statistics_filter_by', { values: { value: formatHour(hour) } })}
            >
              {hour % 3 === 0 ? `${hour.toString().padStart(2, '0')}` : ''}
            </a>
          {/each}
        </div>

        <div class="space-y-1">
          {#each temporalRows as row (row.dayOfWeek)}
            <div class="grid grid-cols-[4.5rem_repeat(24,minmax(0,1fr))] gap-1">
              <a
                href={getSearchUrl(row.dayOfWeek, undefined)}
                class="flex h-8 items-center justify-end pr-2 text-xs font-semibold text-gray-500 transition-colors hover:text-primary dark:text-immich-dark-fg/75"
                aria-label={$t('statistics_filter_by', { values: { value: row.label } })}
                title={$t('statistics_filter_by', { values: { value: row.label } })}
              >
                {row.label}
              </a>

              {#each row.cells as cell (cell.hour)}
                <TemporalCell
                  href={getSearchUrl(row.dayOfWeek, cell.hour)}
                  ariaLabel={`${row.label} ${formatHour(cell.hour)}: ${cell.count.toLocaleString()} ${$t('items')}`}
                  titleAttr={`${row.label} ${formatHour(cell.hour)}: ${cell.count.toLocaleString()} ${$t('items')}`}
                  intensity={cell.intensity}
                />
              {/each}
            </div>
          {/each}
        </div>
      </div>
    </div>
  </section>
{/if}
