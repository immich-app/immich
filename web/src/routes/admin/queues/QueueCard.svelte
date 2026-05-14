<script lang="ts">
  import { cleanClass } from '$lib';
  import QueueCardBadge from './QueueCardBadge.svelte';
  import QueueCardButton from './QueueCardButton.svelte';
  import Badge from '$lib/elements/Badge.svelte';
  import { Route } from '$lib/route';
  import {
    asQueueItem,
    formatSampledJobTypeCount,
    getQueueJobTypeLabel,
    type QueueJobTypeCounts,
  } from '$lib/services/queue.service';
  import { locale } from '$lib/stores/preferences.store';
  import { transformToTitleCase } from '$lib/utils';
  import { QueueCommand, type QueueCommandDto, type QueueResponseDto } from '@immich/sdk';
  import { Icon, IconButton, Link } from '@immich/ui';
  import {
    mdiAlertCircle,
    mdiAllInclusive,
    mdiChartLine,
    mdiClose,
    mdiFastForward,
    mdiImageRefreshOutline,
    mdiPause,
    mdiPlay,
    mdiSelectionSearch,
  } from '@mdi/js';
  import { type Component } from 'svelte';
  import { SvelteMap } from 'svelte/reactivity';
  import { t } from 'svelte-i18n';

  interface Props {
    queue: QueueResponseDto;
    description?: Component;
    disabled?: boolean;
    allText?: string;
    refreshText?: string;
    missingText: string;
    onCommand: (command: QueueCommandDto) => void;
  }

  let { queue, description, disabled = false, allText, refreshText, missingText, onCommand }: Props = $props();

  const { icon, title, subtitle } = $derived(asQueueItem($t, queue));
  const { statistics } = $derived(queue);
  let waitingCount = $derived(statistics.waiting + statistics.paused + statistics.delayed);
  let isIdle = $derived(statistics.active + statistics.waiting === 0 && !queue.isPaused);
  let multipleButtons = $derived(allText || refreshText);
  let jobTypeRows = $derived.by(() => {
    const rows = new SvelteMap<string, Pick<QueueJobTypeCounts, 'active' | 'waiting' | 'delayed' | 'paused'>>();
    for (const jobType of queue.jobTypes ?? []) {
      const label = getQueueJobTypeLabel(jobType.name);
      const row = rows.get(label) ?? { active: 0, waiting: 0, delayed: 0, paused: 0 };
      row.active += jobType.active;
      row.waiting += jobType.waiting;
      row.delayed += jobType.delayed;
      row.paused += jobType.paused;
      rows.set(label, row);
    }

    return [...rows.entries()]
      .map(([label, row]) => ({ label, ...row, pending: row.waiting + row.delayed + row.paused }))
      .filter((row) => row.active + row.pending > 0)
      .sort((a, b) => b.active - a.active || b.pending - a.pending || a.label.localeCompare(b.label));
  });

  const commonClasses = 'flex place-items-center justify-between w-full py-2 sm:py-4 pe-4 ps-6';
  const jobTypeGridClasses = 'grid grid-cols-[minmax(0,1fr)_8rem_5rem] items-center gap-4 px-4 py-2';
</script>

<div class="flex flex-col overflow-hidden rounded-2xl bg-gray-100 dark:bg-immich-dark-gray sm:flex-row sm:rounded-9">
  <div class="flex w-full flex-col">
    {#if queue.isPaused}
      <QueueCardBadge color="warning">{$t('paused')}</QueueCardBadge>
    {:else if statistics.active > 0}
      <QueueCardBadge color="success">{$t('active')}</QueueCardBadge>
    {/if}
    <div class="flex flex-col gap-2 p-5 sm:p-7 md:p-9">
      <div class="flex items-center gap-2 text-xl font-semibold text-primary">
        <Link class="flex items-center gap-2 hover:underline" href={Route.viewQueue(queue)} underline={false}>
          <Icon {icon} size="1.25em" class="hidden shrink-0 sm:block" />
          <span>{transformToTitleCase(title)}</span>
        </Link>
        <IconButton
          color="primary"
          icon={mdiChartLine}
          aria-label={$t('view_details')}
          size="small"
          variant="ghost"
          href={Route.viewQueue(queue)}
        />
        <div class="flex gap-2">
          {#if statistics.failed > 0}
            <Badge>
              <div class="flex flex-row gap-1">
                <span class="text-sm">
                  {$t('admin.jobs_failed', { values: { jobCount: statistics.failed.toLocaleString($locale) } })}
                </span>
                <IconButton
                  color="primary"
                  icon={mdiClose}
                  aria-label={$t('clear_message')}
                  size="tiny"
                  shape="round"
                  onclick={() => onCommand({ command: QueueCommand.ClearFailed, force: false })}
                />
              </div>
            </Badge>
          {/if}
          {#if statistics.delayed > 0}
            <Badge>
              <span class="text-sm">
                {$t('admin.jobs_delayed', { values: { jobCount: statistics.delayed.toLocaleString($locale) } })}
              </span>
            </Badge>
          {/if}
        </div>
      </div>

      {#if subtitle}
        <div class="whitespace-pre-line text-sm dark:text-white">{subtitle}</div>
      {/if}

      {#if description}
        {@const SvelteComponent = description}
        <div class="text-sm dark:text-white">
          <SvelteComponent />
        </div>
      {/if}

      <div class="mt-2 flex w-full max-w-md flex-col sm:flex-row">
        <div
          class={cleanClass(
            commonClasses,
            'rounded-t-lg bg-immich-primary text-white dark:bg-immich-dark-primary dark:text-immich-dark-gray sm:rounded-s-lg sm:rounded-e-none',
          )}
        >
          <p>{$t('active')}</p>
          <p class="text-2xl">
            {statistics.active.toLocaleString($locale)}
          </p>
        </div>

        <div
          class={cleanClass(
            commonClasses,
            'flex-row-reverse rounded-b-lg bg-gray-200 text-immich-dark-bg dark:bg-gray-700 dark:text-immich-gray sm:rounded-s-none sm:rounded-e-lg',
          )}
        >
          <p class="text-2xl">
            {waitingCount.toLocaleString($locale)}
          </p>
          <p>{$t('waiting')}</p>
        </div>
      </div>

      {#if jobTypeRows.length > 0}
        <div
          class="mt-2 flex w-full max-w-xl flex-col divide-y divide-gray-200 rounded-lg bg-white/70 text-sm text-gray-700 dark:divide-gray-700 dark:bg-black/20 dark:text-gray-200"
        >
          <div class={cleanClass(jobTypeGridClasses, 'text-xs font-medium uppercase text-gray-500 dark:text-gray-400')}>
            <span>Job type</span>
            <span class="justify-self-end text-end">In progress</span>
            <span class="justify-self-end text-end">Queued</span>
          </div>
          {#each jobTypeRows as row (row.label)}
            <div class={jobTypeGridClasses}>
              <span class="min-w-0 truncate">{row.label}</span>
              <span class="justify-self-end tabular-nums">
                {formatSampledJobTypeCount(row.active, (count) => count.toLocaleString($locale))}
              </span>
              <span class="justify-self-end tabular-nums text-gray-500 dark:text-gray-400">
                {formatSampledJobTypeCount(row.pending, (count) => count.toLocaleString($locale))}
              </span>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
  <div class="flex w-full flex-row overflow-hidden sm:w-32 sm:flex-col">
    {#if disabled}
      <QueueCardButton
        disabled={true}
        color="light-gray"
        onClick={() => onCommand({ command: QueueCommand.Start, force: false })}
      >
        <Icon icon={mdiAlertCircle} size="36" />
        <span>{$t('disabled')}</span>
      </QueueCardButton>
    {/if}

    {#if !disabled && !isIdle}
      {#if waitingCount > 0}
        <QueueCardButton color="gray" onClick={() => onCommand({ command: QueueCommand.Empty, force: false })}>
          <Icon icon={mdiClose} size="24" />
          <span>{$t('clear')}</span>
        </QueueCardButton>
      {/if}
      {#if queue.isPaused}
        {@const size = waitingCount > 0 ? '24' : '48'}
        <QueueCardButton color="light-gray" onClick={() => onCommand({ command: QueueCommand.Resume, force: false })}>
          <!-- size property is not reactive, so have to use width and height -->
          <Icon icon={mdiFastForward} {size} />
          <span>{$t('resume')}</span>
        </QueueCardButton>
      {:else}
        <QueueCardButton color="light-gray" onClick={() => onCommand({ command: QueueCommand.Pause, force: false })}>
          <Icon icon={mdiPause} size="24" />
          <span>{$t('pause')}</span>
        </QueueCardButton>
      {/if}
    {/if}

    {#if !disabled && multipleButtons && isIdle}
      {#if allText}
        <QueueCardButton color="dark-gray" onClick={() => onCommand({ command: QueueCommand.Start, force: true })}>
          <Icon icon={mdiAllInclusive} size="24" />
          <span>{allText}</span>
        </QueueCardButton>
      {/if}
      {#if refreshText}
        <QueueCardButton color="gray" onClick={() => onCommand({ command: QueueCommand.Start, force: undefined })}>
          <Icon icon={mdiImageRefreshOutline} size="24" />
          <span>{refreshText}</span>
        </QueueCardButton>
      {/if}
      <QueueCardButton color="light-gray" onClick={() => onCommand({ command: QueueCommand.Start, force: false })}>
        <Icon icon={mdiSelectionSearch} size="24" />
        <span>{missingText}</span>
      </QueueCardButton>
    {/if}

    {#if !disabled && !multipleButtons && isIdle}
      <QueueCardButton color="light-gray" onClick={() => onCommand({ command: QueueCommand.Start, force: false })}>
        <Icon icon={mdiPlay} size="48" />
        <span>{missingText}</span>
      </QueueCardButton>
    {/if}
  </div>
</div>
