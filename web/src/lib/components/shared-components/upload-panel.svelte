<script lang="ts">
  import { locale } from '$lib/stores/preferences.store';
  import { uploadAssetsStore } from '$lib/stores/upload';
  import { uploadExecutionQueue } from '$lib/utils/file-uploader';
  import { Icon, IconButton } from '@immich/ui';
  import { mdiCancel, mdiCloudUploadOutline, mdiCog, mdiWindowMinimize } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import { quartInOut } from 'svelte/easing';
  import { fade, scale } from 'svelte/transition';
  import { notificationController, NotificationType } from './notification/notification';
  import UploadAssetPreview from './upload-asset-preview.svelte';

  let showDetail = $state(false);
  let showOptions = $state(false);
  let concurrency = $state(uploadExecutionQueue.concurrency);

  let { stats, isDismissible, isUploading, remainingUploads } = uploadAssetsStore;

  $effect(() => {
    if ($isUploading) {
      showDetail = true;
    }
  });
</script>

{#if $isUploading}
  <div
    in:fade={{ duration: 250 }}
    out:fade={{ duration: 250 }}
    onoutroend={() => {
      if ($stats.errors > 0) {
        notificationController.show({
          message: $t('upload_errors', { values: { count: $stats.errors } }),
          type: NotificationType.Warning,
        });
      } else if ($stats.success > 0) {
        notificationController.show({
          message: $t('upload_success'),
          type: NotificationType.Info,
        });
      }
      if ($stats.duplicates > 0) {
        notificationController.show({
          message: $t('upload_skipped_duplicates', { values: { count: $stats.duplicates } }),
          type: NotificationType.Warning,
        });
      }
      uploadAssetsStore.reset();
    }}
    class="fixed bottom-6 end-16"
  >
    {#if showDetail}
      <div
        in:scale={{ duration: 250, easing: quartInOut }}
        class="w-[300px] rounded-lg border bg-gray-100 p-4 text-sm shadow-sm dark:border-immich-dark-gray dark:bg-immich-dark-gray dark:text-white"
      >
        <div class="place-item-center mb-4 flex justify-between">
          <div class="flex flex-col gap-1">
            <p class="immich-form-label text-xm">
              {$t('upload_progress', {
                values: {
                  remaining: $remainingUploads,
                  processed: $stats.total - $remainingUploads,
                  total: $stats.total,
                },
              })}
            </p>
            <p class="immich-form-label text-xs">
              {$t('upload_status_uploaded')}
              <span class="text-success">{$stats.success.toLocaleString($locale)}</span>
              -
              {$t('upload_status_errors')}
              <span class="text-danger">{$stats.errors.toLocaleString($locale)}</span>
              -
              {$t('upload_status_duplicates')}
              <span class="text-warning">{$stats.duplicates.toLocaleString($locale)}</span>
            </p>
          </div>
          <div class="flex flex-col items-end">
            <div class="flex flex-row">
              <IconButton
                variant="ghost"
                shape="round"
                color="secondary"
                icon={mdiCog}
                size="small"
                onclick={() => (showOptions = !showOptions)}
                aria-label={$t('toggle_settings')}
              />
              <IconButton
                variant="ghost"
                shape="round"
                color="secondary"
                aria-label={$t('minimize')}
                icon={mdiWindowMinimize}
                size="small"
                onclick={() => (showDetail = false)}
              />
            </div>
            {#if $isDismissible}
              <IconButton
                variant="ghost"
                shape="round"
                color="secondary"
                aria-label={$t('dismiss_all_errors')}
                icon={mdiCancel}
                size="small"
                onclick={() => uploadAssetsStore.dismissErrors()}
              />
            {/if}
          </div>
        </div>
        {#if showOptions}
          <div class="immich-scrollbar mb-4 max-h-[400px] overflow-y-auto rounded-lg">
            <div class="flex h-[26px] place-items-center gap-1">
              <label class="immich-form-label" for="upload-concurrency">{$t('upload_concurrency')}</label>
            </div>
            <input
              class="immich-form-input w-full"
              aria-labelledby={$t('upload_concurrency')}
              id="upload-concurrency"
              name={$t('upload_concurrency')}
              type="number"
              min="1"
              max="50"
              step="1"
              bind:value={concurrency}
              onchange={() => (uploadExecutionQueue.concurrency = concurrency)}
            />
          </div>
        {/if}
        <div class="immich-scrollbar flex max-h-[400px] flex-col gap-2 overflow-y-auto rounded-lg">
          {#each $uploadAssetsStore as uploadAsset (uploadAsset.id)}
            <UploadAssetPreview {uploadAsset} />
          {/each}
        </div>
      </div>
    {:else}
      <div class="rounded-full">
        <button
          type="button"
          in:scale={{ duration: 250, easing: quartInOut }}
          onclick={() => (showDetail = true)}
          class="absolute -start-4 -top-4 flex h-10 w-10 place-content-center place-items-center rounded-full bg-primary p-5 text-xs text-gray-200"
        >
          {$remainingUploads.toLocaleString($locale)}
        </button>
        {#if $stats.errors > 0}
          <button
            type="button"
            in:scale={{ duration: 250, easing: quartInOut }}
            onclick={() => (showDetail = true)}
            class="absolute -end-4 -top-4 flex h-10 w-10 place-content-center place-items-center rounded-full bg-danger p-5 text-xs text-gray-200"
          >
            {$stats.errors.toLocaleString($locale)}
          </button>
        {/if}
        <button
          type="button"
          in:scale={{ duration: 250, easing: quartInOut }}
          onclick={() => (showDetail = true)}
          class="flex h-16 w-16 place-content-center place-items-center rounded-full bg-subtle p-5 text-sm text-primary shadow-lg"
        >
          <div class="animate-pulse">
            <Icon icon={mdiCloudUploadOutline} size="30" />
          </div>
        </button>
      </div>
    {/if}
  </div>
{/if}
