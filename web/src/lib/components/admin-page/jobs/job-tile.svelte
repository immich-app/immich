<script lang="ts">
  import Badge from '$lib/components/elements/badge.svelte';
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import Icon from '$lib/components/elements/icon.svelte';
  import { locale } from '$lib/stores/preferences.store';
  import { JobCommand, type JobCommandDto, type JobCountsDto, type QueueStatusDto } from '@immich/sdk';
  import {
    mdiAlertCircle,
    mdiAllInclusive,
    mdiClose,
    mdiFastForward,
    mdiImageRefreshOutline,
    mdiPause,
    mdiPlay,
    mdiSelectionSearch,
  } from '@mdi/js';
  import { type ComponentType } from 'svelte';
  import { t } from 'svelte-i18n';
  import JobTileButton from './job-tile-button.svelte';
  import JobTileStatus from './job-tile-status.svelte';

  export let title: string;
  export let subtitle: string | undefined;
  export let description: ComponentType | undefined;
  export let jobCounts: JobCountsDto;
  export let queueStatus: QueueStatusDto;
  export let icon: string;
  export let disabled = false;

  export let allText: string | undefined;
  export let refreshText: string | undefined;
  export let missingText: string;
  export let onCommand: (command: JobCommandDto) => void;

  $: waitingCount = jobCounts.waiting + jobCounts.paused + jobCounts.delayed;
  $: isIdle = !queueStatus.isActive && !queueStatus.isPaused;
  $: multipleButtons = allText || refreshText;

  const commonClasses = 'flex place-items-center justify-between w-full py-2 sm:py-4 pr-4 pl-6';
</script>

<div
  class="flex flex-col overflow-hidden rounded-2xl bg-gray-100 dark:bg-immich-dark-gray sm:flex-row sm:rounded-[35px]"
>
  <div class="flex w-full flex-col">
    {#if queueStatus.isPaused}
      <JobTileStatus color="warning">{$t('paused')}</JobTileStatus>
    {:else if queueStatus.isActive}
      <JobTileStatus color="success">{$t('active')}</JobTileStatus>
    {/if}
    <div class="flex flex-col gap-2 p-5 sm:p-7 md:p-9">
      <div class="flex items-center gap-4 text-xl font-semibold text-immich-primary dark:text-immich-dark-primary">
        <span class="flex items-center gap-2">
          <Icon path={icon} size="1.25em" class="hidden shrink-0 sm:block" />
          {title.toUpperCase()}
        </span>
        <div class="flex gap-2">
          {#if jobCounts.failed > 0}
            <Badge color="primary">
              <div class="flex flex-row gap-1">
                <span class="text-sm">
                  {$t('admin.jobs_failed', { values: { jobCount: jobCounts.failed.toLocaleString($locale) } })}
                </span>
                <CircleIconButton
                  color="primary"
                  icon={mdiClose}
                  title={$t('clear_message')}
                  size="12"
                  padding="1"
                  on:click={() => onCommand({ command: JobCommand.ClearFailed, force: false })}
                />
              </div>
            </Badge>
          {/if}
          {#if jobCounts.delayed > 0}
            <Badge color="secondary">
              <span class="text-sm">
                {$t('admin.jobs_delayed', { values: { jobCount: jobCounts.delayed.toLocaleString($locale) } })}
              </span>
            </Badge>
          {/if}
        </div>
      </div>

      {#if subtitle}
        <div class="whitespace-pre-line text-sm dark:text-white">{subtitle}</div>
      {/if}

      {#if description}
        <div class="text-sm dark:text-white">
          <svelte:component this={description} />
        </div>
      {/if}

      <div class="mt-2 flex w-full max-w-md flex-col sm:flex-row">
        <div
          class="{commonClasses} rounded-t-lg bg-immich-primary text-white dark:bg-immich-dark-primary dark:text-immich-dark-gray sm:rounded-l-lg sm:rounded-r-none"
        >
          <p>{$t('active')}</p>
          <p class="text-2xl">
            {jobCounts.active.toLocaleString($locale)}
          </p>
        </div>

        <div
          class="{commonClasses} flex-row-reverse rounded-b-lg bg-gray-200 text-immich-dark-bg dark:bg-gray-700 dark:text-immich-gray sm:rounded-l-none sm:rounded-r-lg"
        >
          <p class="text-2xl">
            {waitingCount.toLocaleString($locale)}
          </p>
          <p>{$t('waiting')}</p>
        </div>
      </div>
    </div>
  </div>
  <div class="flex w-full flex-row overflow-hidden sm:w-32 sm:flex-col">
    {#if disabled}
      <JobTileButton
        disabled={true}
        color="light-gray"
        on:click={() => onCommand({ command: JobCommand.Start, force: false })}
      >
        <Icon path={mdiAlertCircle} size="36" />
        {$t('disabled').toUpperCase()}
      </JobTileButton>
    {/if}

    {#if !disabled && !isIdle}
      {#if waitingCount > 0}
        <JobTileButton color="gray" on:click={() => onCommand({ command: JobCommand.Empty, force: false })}>
          <Icon path={mdiClose} size="24" />
          {$t('clear').toUpperCase()}
        </JobTileButton>
      {/if}
      {#if queueStatus.isPaused}
        {@const size = waitingCount > 0 ? '24' : '48'}
        <JobTileButton color="light-gray" on:click={() => onCommand({ command: JobCommand.Resume, force: false })}>
          <!-- size property is not reactive, so have to use width and height -->
          <Icon path={mdiFastForward} {size} />
          {$t('resume').toUpperCase()}
        </JobTileButton>
      {:else}
        <JobTileButton color="light-gray" on:click={() => onCommand({ command: JobCommand.Pause, force: false })}>
          <Icon path={mdiPause} size="24" />
          {$t('pause').toUpperCase()}
        </JobTileButton>
      {/if}
    {/if}

    {#if !disabled && multipleButtons && isIdle}
      {#if allText}
        <JobTileButton color="dark-gray" on:click={() => onCommand({ command: JobCommand.Start, force: true })}>
          <Icon path={mdiAllInclusive} size="24" />
          {allText}
        </JobTileButton>
      {/if}
      {#if refreshText}
        <JobTileButton color="gray" on:click={() => onCommand({ command: JobCommand.Start, force: undefined })}>
          <Icon path={mdiImageRefreshOutline} size="24" />
          {refreshText}
        </JobTileButton>
      {/if}
      <JobTileButton color="light-gray" on:click={() => onCommand({ command: JobCommand.Start, force: false })}>
        <Icon path={mdiSelectionSearch} size="24" />
        {missingText}
      </JobTileButton>
    {/if}

    {#if !disabled && !multipleButtons && isIdle}
      <JobTileButton color="light-gray" on:click={() => onCommand({ command: JobCommand.Start, force: false })}>
        <Icon path={mdiPlay} size="48" />
        {$t('start').toUpperCase()}
      </JobTileButton>
    {/if}
  </div>
</div>
