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
  import { s } from '$lib/utils';
  import { t } from 'svelte-i18n';

  let showDetail = false;
  let showOptions = false;
  let concurrency = uploadExecutionQueue.concurrency;

  let { isUploading, hasError, remainingUploads, errorCounter, duplicateCounter, successCounter, totalUploadCounter } =
    uploadAssetsStore;

  const autoHide = () => {
    if (!$isUploading && showDetail) {
      showDetail = false;
    }

    if ($isUploading && !showDetail) {
      showDetail = true;
    }
  };

  $: $isUploading && autoHide();
</script>

{#if $hasError || $isUploading}
  <div
    in:fade={{ duration: 250 }}
    out:fade={{ duration: 250 }}
    on:outroend={() => {
      if ($errorCounter > 0) {
        notificationController.show({
          message: `Upload completed with ${$errorCounter} error${s($errorCounter)}, refresh the page to see new upload assets.`,
          type: NotificationType.Warning,
        });
      } else if ($successCounter > 0) {
        notificationController.show({
          message: 'Upload success, refresh the page to see new upload assets.',
          type: NotificationType.Info,
        });
      }
      if ($duplicateCounter > 0) {
        notificationController.show({
          message: `Skipped ${$duplicateCounter} duplicate asset${s($duplicateCounter)}`,
          type: NotificationType.Warning,
        });
      }
      uploadAssetsStore.resetStore();
    }}
    class="absolute bottom-6 right-6 z-[10000]"
  >
    {#if showDetail}
      <div
        in:scale={{ duration: 250, easing: quartInOut }}
        class="w-[300px] rounded-lg border bg-gray-100 p-4 text-sm shadow-sm dark:border-immich-dark-gray dark:bg-immich-dark-gray dark:text-white"
      >
        <div class="place-item-center mb-4 flex justify-between">
          <div class="flex flex-col gap-1">
            <p class="immich-form-label text-xm">
              Remaining {$remainingUploads} - Processed {$successCounter + $errorCounter}/{$totalUploadCounter}
            </p>
            <p class="immich-form-label text-xs">
              Uploaded <span class="text-immich-success">{$successCounter}</span> - Error
              <span class="text-immich-error">{$errorCounter}</span>
              - Duplicates <span class="text-immich-warning">{$duplicateCounter}</span>
            </p>
          </div>
          <div class="flex flex-col items-end">
            <div class="flex flex-row">
              <CircleIconButton
                title={$t('toggle_settings')}
                icon={mdiCog}
                size="14"
                padding="1"
                on:click={() => (showOptions = !showOptions)}
              />
              <CircleIconButton
                title={$t('minimize')}
                icon={mdiWindowMinimize}
                size="14"
                padding="1"
                on:click={() => (showDetail = false)}
              />
            </div>
            {#if $hasError}
              <CircleIconButton
                title={$t('dismiss_all_errors')}
                icon={mdiCancel}
                size="14"
                padding="1"
                on:click={() => uploadAssetsStore.dismissErrors()}
              />
            {/if}
          </div>
        </div>
        {#if showOptions}
          <div class="immich-scrollbar mb-4 max-h-[400px] overflow-y-auto rounded-lg pr-2">
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
              on:change={() => (uploadExecutionQueue.concurrency = concurrency)}
            />
          </div>
        {/if}
        <div class="immich-scrollbar flex max-h-[400px] flex-col gap-2 overflow-y-auto rounded-lg pr-2">
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
          on:click={() => (showDetail = true)}
          class="absolute -left-4 -top-4 flex h-10 w-10 place-content-center place-items-center rounded-full bg-immich-primary p-5 text-xs text-gray-200"
        >
          {$remainingUploads}
        </button>
        {#if $hasError}
          <button
            type="button"
            in:scale={{ duration: 250, easing: quartInOut }}
            on:click={() => (showDetail = true)}
            class="absolute -right-4 -top-4 flex h-10 w-10 place-content-center place-items-center rounded-full bg-immich-error p-5 text-xs text-gray-200"
          >
            {$errorCounter}
          </button>
        {/if}
        <button
          type="button"
          in:scale={{ duration: 250, easing: quartInOut }}
          on:click={() => (showDetail = true)}
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
