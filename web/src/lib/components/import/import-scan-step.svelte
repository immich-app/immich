<script lang="ts">
  import type { ScanProgress } from '$lib/utils/google-takeout-scanner';
  import { Button, Icon } from '@immich/ui';
  import { mdiArchive, mdiClose, mdiImage, mdiMapMarker, mdiStar } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    progress: ScanProgress | undefined;
    onCancel: () => void;
  }

  let { progress, onCancel }: Props = $props();

  let progressPercent = $derived(
    progress && progress.zipCount > 0 ? Math.round((progress.zipIndex / progress.zipCount) * 100) : 0,
  );
</script>

<div class="flex flex-col items-center gap-6">
  <h2 class="text-xl font-medium">{$t('import_scanning')}</h2>
  <p class="text-sm text-gray-500">{$t('import_scanning_description')}</p>

  <!-- Progress bar -->
  <div class="w-full">
    <div class="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
      <div
        data-testid="scan-progress-bar"
        class="h-full rounded-full bg-primary transition-all duration-300"
        style="width: {progressPercent}%"
      ></div>
    </div>
    {#if progress}
      <p class="mt-1 text-center text-xs text-gray-400">
        {progress.currentZip} ({progress.zipIndex + 1} / {progress.zipCount})
      </p>
    {/if}
  </div>

  <!-- Current file -->
  {#if progress?.currentFile}
    <p class="max-w-full truncate text-sm text-gray-500">
      {progress.currentFile}
    </p>
  {/if}

  <!-- Stats -->
  {#if progress}
    <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <div class="flex flex-col items-center gap-1 rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
        <Icon icon={mdiImage} size="20" class="text-primary" />
        <span class="text-lg font-semibold">{progress.mediaCount}</span>
        <span class="text-xs text-gray-500">{$t('import_found_so_far')}</span>
      </div>
      <div class="flex flex-col items-center gap-1 rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
        <Icon icon={mdiMapMarker} size="20" class="text-green-500" />
        <span class="text-lg font-semibold">{progress.withLocation}</span>
        <span class="text-xs text-gray-500">{$t('location')}</span>
      </div>
      <div class="flex flex-col items-center gap-1 rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
        <Icon icon={mdiStar} size="20" class="text-yellow-500" />
        <span class="text-lg font-semibold">{progress.favorites}</span>
        <span class="text-xs text-gray-500">{$t('favorites')}</span>
      </div>
      <div class="flex flex-col items-center gap-1 rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
        <Icon icon={mdiArchive} size="20" class="text-gray-500" />
        <span class="text-lg font-semibold">{progress.albumNames.size}</span>
        <span class="text-xs text-gray-500">{$t('albums')}</span>
      </div>
    </div>
  {/if}

  <!-- Cancel button -->
  <Button variant="outline" color="danger" leadingIcon={mdiClose} onclick={onCancel}>
    {$t('cancel')}
  </Button>
</div>
