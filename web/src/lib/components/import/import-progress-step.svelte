<script lang="ts">
  import type { ImportProgress } from '$lib/managers/import-manager.svelte';
  import { Button, Icon } from '@immich/ui';
  import {
    mdiAlertCircle,
    mdiCheckCircle,
    mdiCheckDecagram,
    mdiClockOutline,
    mdiImage,
    mdiPause,
    mdiPlay,
    mdiSkipNext,
  } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    progress: ImportProgress;
    total: number;
    isPaused: boolean;
    isComplete: boolean;
    onTogglePause: () => void;
  }

  let { progress, total, isPaused, isComplete, onTogglePause }: Props = $props();

  let progressPercent = $derived(
    total > 0 ? Math.round(((progress.imported + progress.skipped + progress.errors) / total) * 100) : 0,
  );

  let remaining = $derived(total - progress.imported - progress.skipped - progress.errors);
</script>

{#if isComplete}
  <!-- Complete state -->
  <div class="flex flex-col items-center gap-6">
    <div class="flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
      <Icon icon={mdiCheckDecagram} size="48" class="text-green-500" />
    </div>

    <h2 class="text-2xl font-medium">{$t('import_complete')}</h2>

    <!-- Final stats -->
    <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <div class="flex flex-col items-center gap-1 rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
        <Icon icon={mdiCheckCircle} size="20" class="text-green-500" />
        <span class="text-lg font-semibold">{progress.imported}</span>
        <span class="text-xs text-gray-500">{$t('import_status_imported')}</span>
      </div>
      <div class="flex flex-col items-center gap-1 rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
        <Icon icon={mdiSkipNext} size="20" class="text-yellow-500" />
        <span class="text-lg font-semibold">{progress.skipped}</span>
        <span class="text-xs text-gray-500">{$t('import_status_skipped')}</span>
      </div>
      <div class="flex flex-col items-center gap-1 rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
        <Icon icon={mdiAlertCircle} size="20" class="text-red-500" />
        <span class="text-lg font-semibold">{progress.errors}</span>
        <span class="text-xs text-gray-500">{$t('import_status_errors')}</span>
      </div>
      <div class="flex flex-col items-center gap-1 rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
        <Icon icon={mdiImage} size="20" class="text-primary" />
        <span class="text-lg font-semibold">{progress.albumsCreated}</span>
        <span class="text-xs text-gray-500">{$t('albums')}</span>
      </div>
    </div>

    <!-- Navigation links -->
    <div class="flex gap-4">
      <Button href="/photos">
        {$t('import_view_photos')}
      </Button>
      <Button variant="outline" href="/albums">
        {$t('import_view_albums')}
      </Button>
    </div>
  </div>
{:else}
  <!-- Importing state -->
  <div class="flex flex-col items-center gap-6">
    <h2 class="text-xl font-medium">{$t('import_importing')}</h2>
    <p class="text-sm text-gray-500">{$t('import_keep_tab_open')}</p>

    <!-- Progress bar -->
    <div class="w-full">
      <div class="h-3 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          data-testid="import-progress-bar"
          class="h-full rounded-full bg-primary transition-all duration-300"
          style="width: {progressPercent}%"
        ></div>
      </div>
      <p class="mt-1 text-center text-sm text-gray-500">
        {progress.imported + progress.skipped + progress.errors} / {total}
      </p>
    </div>

    <!-- Status counters -->
    <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <div
        data-testid="status-imported"
        class="flex flex-col items-center gap-1 rounded-lg bg-green-50 p-3 dark:bg-green-900/20"
      >
        <Icon icon={mdiCheckCircle} size="18" class="text-green-500" />
        <span class="text-lg font-semibold text-green-600 dark:text-green-400">{progress.imported}</span>
        <span class="text-xs text-gray-500">{$t('import_status_imported')}</span>
      </div>
      <div
        data-testid="status-skipped"
        class="flex flex-col items-center gap-1 rounded-lg bg-yellow-50 p-3 dark:bg-yellow-900/20"
      >
        <Icon icon={mdiSkipNext} size="18" class="text-yellow-500" />
        <span class="text-lg font-semibold text-yellow-600 dark:text-yellow-400">{progress.skipped}</span>
        <span class="text-xs text-gray-500">{$t('import_status_skipped')}</span>
      </div>
      <div
        data-testid="status-errors"
        class="flex flex-col items-center gap-1 rounded-lg bg-red-50 p-3 dark:bg-red-900/20"
      >
        <Icon icon={mdiAlertCircle} size="18" class="text-red-500" />
        <span class="text-lg font-semibold text-red-600 dark:text-red-400">{progress.errors}</span>
        <span class="text-xs text-gray-500">{$t('import_status_errors')}</span>
      </div>
      <div
        data-testid="status-remaining"
        class="flex flex-col items-center gap-1 rounded-lg bg-gray-50 p-3 dark:bg-gray-800"
      >
        <Icon icon={mdiClockOutline} size="18" class="text-gray-400" />
        <span class="text-lg font-semibold text-gray-500">{remaining}</span>
        <span class="text-xs text-gray-500">{$t('import_status_remaining')}</span>
      </div>
    </div>

    <!-- Current file -->
    {#if progress.currentFile}
      <p class="max-w-full truncate text-sm text-gray-500">
        {progress.currentFile}
      </p>
    {/if}

    <!-- Pause/Resume button -->
    <Button
      data-testid="pause-button"
      variant="outline"
      leadingIcon={isPaused ? mdiPlay : mdiPause}
      onclick={onTogglePause}
    >
      {isPaused ? $t('import_resume') : $t('import_pause')}
    </Button>
  </div>
{/if}
