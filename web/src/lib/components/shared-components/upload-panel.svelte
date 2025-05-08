<script lang="ts">
  import { quartInOut } from 'svelte/easing';
  import { fade, scale } from 'svelte/transition';
  import { uploadAssetsStore } from '$lib/stores/upload';
  import Icon from '$lib/components/elements/icon.svelte';
  import { notificationController, NotificationType } from './notification/notification';
  import UploadAssetPreview from './upload-asset-preview.svelte';
  import { uploadExecutionQueue } from '$lib/utils/file-uploader';
  import CircleIconButton from '../elements/buttons/circle-icon-button.svelte';
  import { mdiCog, mdiWindowMinimize, mdiCancel, mdiCloudUploadOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import { locale } from '$lib/stores/preferences.store';

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
    class="fixed bottom-6 end-16 z-[10000]"
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
              <span class="text-immich-success">{$stats.success.toLocaleString($locale)}</span>
              -
              {$t('upload_status_errors')}
              <span class="text-immich-error">{$stats.errors.toLocaleString($locale)}</span>
              -
              {$t('upload_status_duplicates')}
              <span class="text-immich-warning">{$stats.duplicates.toLocaleString($locale)}</span>
            </p>
          </div>
          <div class="flex flex-col items-end">
            <div class="flex flex-row">
              <CircleIconButton
                title={$t('toggle_settings')}
                icon={mdiCog}
                size="14"
                padding="1"
                onclick={() => (showOptions = !showOptions)}
              />
              <CircleIconButton
                title={$t('minimize')}
                icon={mdiWindowMinimize}
                size="14"
                padding="1"
                onclick={() => (showDetail = false)}
              />
            </div>
            {#if $isDismissible}
              <CircleIconButton
                title={$t('dismiss_all_errors')}
                icon={mdiCancel}
                size="14"
                padding="1"
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
          class="absolute -start-4 -top-4 flex h-10 w-10 place-content-center place-items-center rounded-full bg-immich-primary p-5 text-xs text-gray-200"
        >
          {$remainingUploads.toLocaleString($locale)}
        </button>
        {#if $stats.errors > 0}
          <button
            type="button"
            in:scale={{ duration: 250, easing: quartInOut }}
            onclick={() => (showDetail = true)}
            class="absolute -end-4 -top-4 flex h-10 w-10 place-content-center place-items-center rounded-full bg-immich-error p-5 text-xs text-gray-200"
          >
            {$stats.errors.toLocaleString($locale)}
          </button>
        {/if}
        <button
          type="button"
          in:scale={{ duration: 250, easing: quartInOut }}
          onclick={() => (showDetail = true)}
          class="flex h-16 w-16 place-content-center place-items-center rounded-full bg-gray-200 p-5 text-sm text-immich-primary shadow-lg dark:bg-gray-600 dark:text-immich-gray"
        >
          <div class="animate-pulse">
            <Icon path={mdiCloudUploadOutline} size="30" />
          </div>
        </button>
      </div>
    {/if}
  </div>
{/if}
