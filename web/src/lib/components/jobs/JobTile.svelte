<script lang="ts">
  import Badge from '$lib/elements/Badge.svelte';
  import { locale } from '$lib/stores/preferences.store';
  import { JobCommand, type JobCommandDto, type JobCountsDto, type QueueStatusDto } from '@immich/sdk';
  import { Icon, IconButton } from '@immich/ui';
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
  import { type Component } from 'svelte';
  import { t } from 'svelte-i18n';
  import JobTileButton from './JobTileButton.svelte';
  import JobTileStatus from './JobTileStatus.svelte';

  interface Props {
    title: string;
    subtitle: string | undefined;
    description: Component | undefined;
    jobCounts: JobCountsDto;
    queueStatus: QueueStatusDto;
    icon: string;
    disabled?: boolean;
    allText: string | undefined;
    refreshText: string | undefined;
    missingText: string;
    onCommand: (command: JobCommandDto) => void;
  }

  let {
    title,
    subtitle,
    description,
    jobCounts,
    queueStatus,
    icon,
    disabled = false,
    allText,
    refreshText,
    missingText,
    onCommand,
  }: Props = $props();

  let waitingCount = $derived(jobCounts.waiting + jobCounts.paused + jobCounts.delayed);
  let isIdle = $derived(!queueStatus.isActive && !queueStatus.isPaused);
  let multipleButtons = $derived(allText || refreshText);

  const commonClasses = 'flex place-items-center justify-between w-full py-2 sm:py-4 pe-4 ps-6';
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
      <div class="flex items-center gap-4 text-xl font-semibold text-primary">
        <span class="flex items-center gap-2">
          <Icon {icon} size="1.25em" class="hidden shrink-0 sm:block" />
          <span class="uppercase">{title}</span>
        </span>
        <div class="flex gap-2">
          {#if jobCounts.failed > 0}
            <Badge>
              <div class="flex flex-row gap-1">
                <span class="text-sm">
                  {$t('admin.jobs_failed', { values: { jobCount: jobCounts.failed.toLocaleString($locale) } })}
                </span>
                <IconButton
                  color="primary"
                  icon={mdiClose}
                  aria-label={$t('clear_message')}
                  size="tiny"
                  shape="round"
                  onclick={() => onCommand({ command: JobCommand.ClearFailed, force: false })}
                />
              </div>
            </Badge>
          {/if}
          {#if jobCounts.delayed > 0}
            <Badge>
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
        {@const SvelteComponent = description}
        <div class="text-sm dark:text-white">
          <SvelteComponent />
        </div>
      {/if}

      <div class="mt-2 flex w-full max-w-md flex-col sm:flex-row">
        <div
          class="{commonClasses} rounded-t-lg bg-immich-primary text-white dark:bg-immich-dark-primary dark:text-immich-dark-gray sm:rounded-s-lg sm:rounded-e-none"
        >
          <p>{$t('active')}</p>
          <p class="text-2xl">
            {jobCounts.active.toLocaleString($locale)}
          </p>
        </div>

        <div
          class="{commonClasses} flex-row-reverse rounded-b-lg bg-gray-200 text-immich-dark-bg dark:bg-gray-700 dark:text-immich-gray sm:rounded-s-none sm:rounded-e-lg"
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
        onClick={() => onCommand({ command: JobCommand.Start, force: false })}
      >
        <Icon icon={mdiAlertCircle} size="36" />
        <span class="uppercase">{$t('disabled')}</span>
      </JobTileButton>
    {/if}

    {#if !disabled && !isIdle}
      {#if waitingCount > 0}
        <JobTileButton color="gray" onClick={() => onCommand({ command: JobCommand.Empty, force: false })}>
          <Icon icon={mdiClose} size="24" />
          <span class="uppercase">{$t('clear')}</span>
        </JobTileButton>
      {/if}
      {#if queueStatus.isPaused}
        {@const size = waitingCount > 0 ? '24' : '48'}
        <JobTileButton color="light-gray" onClick={() => onCommand({ command: JobCommand.Resume, force: false })}>
          <!-- size property is not reactive, so have to use width and height -->
          <Icon icon={mdiFastForward} {size} />
          <span class="uppercase">{$t('resume')}</span>
        </JobTileButton>
      {:else}
        <JobTileButton color="light-gray" onClick={() => onCommand({ command: JobCommand.Pause, force: false })}>
          <Icon icon={mdiPause} size="24" />
          <span class="uppercase">{$t('pause')}</span>
        </JobTileButton>
      {/if}
    {/if}

    {#if !disabled && multipleButtons && isIdle}
      {#if allText}
        <JobTileButton color="dark-gray" onClick={() => onCommand({ command: JobCommand.Start, force: true })}>
          <Icon icon={mdiAllInclusive} size="24" />
          <span class="uppercase">{allText}</span>
        </JobTileButton>
      {/if}
      {#if refreshText}
        <JobTileButton color="gray" onClick={() => onCommand({ command: JobCommand.Start, force: undefined })}>
          <Icon icon={mdiImageRefreshOutline} size="24" />
          <span class="uppercase">{refreshText}</span>
        </JobTileButton>
      {/if}
      <JobTileButton color="light-gray" onClick={() => onCommand({ command: JobCommand.Start, force: false })}>
        <Icon icon={mdiSelectionSearch} size="24" />
        <span class="uppercase">{missingText}</span>
      </JobTileButton>
    {/if}

    {#if !disabled && !multipleButtons && isIdle}
      <JobTileButton color="light-gray" onClick={() => onCommand({ command: JobCommand.Start, force: false })}>
        <Icon icon={mdiPlay} size="48" />
        <span class="uppercase">{missingText}</span>
      </JobTileButton>
    {/if}
  </div>
</div>
