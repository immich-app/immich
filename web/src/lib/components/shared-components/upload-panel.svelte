<script lang="ts">
  import {quartInOut} from 'svelte/easing';
  import {fade, scale} from 'svelte/transition';
  import {uploadAssetsStore} from '$lib/stores/upload';
  import CloudUploadOutline from 'svelte-material-icons/CloudUploadOutline.svelte';
  import WindowMinimize from 'svelte-material-icons/WindowMinimize.svelte';
  import Cancel from 'svelte-material-icons/Cancel.svelte';
  import Cog from 'svelte-material-icons/Cog.svelte';
  import {notificationController, NotificationType} from './notification/notification';
  import UploadAssetPreview from './upload-asset-preview.svelte';
  import {uploadExecutionQueue} from "$lib/utils/file-uploader";

  let showDetail = false;
  let showOptions = false;
  let remainingUploads = 0;
  let duplicateCount = 0;
  let errorCount = 0;
  let totalUploadCount = 0;
  let successUploadCount = 0;
  let isUploading = false;
  let hasErrors = false;
  let concurrency = uploadExecutionQueue.concurrency

  uploadAssetsStore.hasError.subscribe((value) => (hasErrors = value));
  uploadAssetsStore.remainingUploads.subscribe((value) => (remainingUploads = value));
  uploadAssetsStore.successCounter.subscribe((value) => (successUploadCount = value));
  uploadAssetsStore.totalUploadCounter.subscribe((value) => (totalUploadCount = value));
  uploadAssetsStore.duplicateCounter.subscribe((value) => (duplicateCount = value));
  uploadAssetsStore.errorCounter.subscribe((value) => (errorCount = value));
  uploadAssetsStore.isUploading.subscribe((value) => {
    isUploading = value;
    if (!isUploading && showDetail) {
      showDetail = false;
    }

    if (isUploading && !showDetail) {
      showDetail = true;
    }
  });
</script>

{#if hasErrors || remainingUploads}
  <div
    in:fade={{ duration: 250 }}
    out:fade={{ duration: 250 }}
    on:outroend={() => {
      const errorInfo =
        errorCount > 0 ? `Upload completed with ${errorCount} error${errorCount > 1 ? 's' : ''}` : 'Upload success';
      const type = errorCount > 0 ? NotificationType.Warning : NotificationType.Info;

      notificationController.show({
        message: `${errorInfo}, refresh the page to see new upload assets`,
        type,
      });

      if (duplicateCount > 0) {
        notificationController.show({
          message: `Skipped ${duplicateCount} duplicate picture${duplicateCount > 1 ? 's' : ''}`,
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
        class="w-[300px] rounded-lg border bg-gray-200 p-4 text-sm shadow-sm"
      >
        <div class="place-item-center mb-4 flex justify-between">
          <p class="text-xs text-gray-500">
            Remaining {remainingUploads} - Processed {successUploadCount + errorCount}/{totalUploadCount} <br/>
            Uploaded <span class="text-immich-success">{successUploadCount}</span> - Error
            <span class="text-immich-error">{errorCount}</span>
            - Duplicates <span class="text-immich-warning">{duplicateCount}</span>
          </p>
          <div class="flex flex-col items-end">
            <div class="flex flex-row">
              <button
                on:click={()=>showOptions=!showOptions}
                class="flex h-[20px] w-[20px] place-content-center place-items-center rounded-full bg-gray-50 transition-colors hover:bg-gray-100"
              >
                <Cog/>
              </button>
              <button
                on:click={() => (showDetail = false)}
                class="flex h-[20px] w-[20px] place-content-center place-items-center rounded-full bg-gray-50 transition-colors hover:bg-gray-100"
              >
                <WindowMinimize/>
              </button>
            </div>
            {#if hasErrors}
              <button
                on:click={() => uploadAssetsStore.dismissErrors()}
                title="Dismiss all errors"
                class="flex h-[20px] w-[20px] place-content-center place-items-center rounded-full bg-gray-50 transition-colors hover:bg-gray-100"
              >
                <span class="text-immich-error"><Cancel/></span>
              </button>
            {/if}
          </div>
        </div>
        {#if showOptions}
          <div class="immich-scrollbar max-h-[400px] overflow-y-auto rounded-lg pr-2">
            <div class="flex h-[26px] place-items-center gap-1">
              <label class="immich-form-label text-xs text-gray-500" for="upload-concurrency">Upload concurrency</label>
            </div>
            <input class="rounded-sm immich-form-input w-full" aria-labelledby="Upload concurrency"
                   id="upload-concurrency"
                   name="Upload concurrency" type="number" min="1" max="50" step="1" required=""
                   bind:value={concurrency}
                   on:change={() => uploadExecutionQueue.concurrency = concurrency}
            />
          </div>
        {/if}
        <div class="immich-scrollbar max-h-[400px] overflow-y-auto rounded-lg pr-2">
          {#each $uploadAssetsStore as uploadAsset}
            {#key uploadAsset.id}
              <UploadAssetPreview {uploadAsset}/>
            {/key}
          {/each}
        </div>
      </div>
    {:else}
      <div class="rounded-full">
        <button
          in:scale={{ duration: 250, easing: quartInOut }}
          on:click={() => (showDetail = true)}
          class="absolute -left-4 -top-4 flex h-10 w-10 place-content-center place-items-center rounded-full bg-immich-primary p-5 text-xs text-gray-200"
        >
          {remainingUploads}
        </button>
        {#if hasErrors}
          <button
            in:scale={{ duration: 250, easing: quartInOut }}
            on:click={() => (showDetail = true)}
            class="absolute -right-4 -top-4 flex h-10 w-10 place-content-center place-items-center rounded-full bg-immich-error p-5 text-xs text-gray-200"
          >
            {errorCount}
          </button>
        {/if}
        <button
          in:scale={{ duration: 250, easing: quartInOut }}
          on:click={() => (showDetail = true)}
          class="flex h-16 w-16 place-content-center place-items-center rounded-full bg-gray-300 p-5 text-sm shadow-lg"
        >
          <div class="animate-pulse">
            <CloudUploadOutline size="30" color="#4250af"/>
          </div>
        </button>
      </div>
    {/if}
  </div>
{/if}
