<script lang="ts">
  import { quartInOut } from 'svelte/easing';
  import { scale, fade } from 'svelte/transition';
  import { uploadAssetsStore } from '$lib/stores/upload';
  import CloudUploadOutline from 'svelte-material-icons/CloudUploadOutline.svelte';
  import WindowMinimize from 'svelte-material-icons/WindowMinimize.svelte';
  import { notificationController, NotificationType } from './notification/notification';
  import UploadAssetPreview from './upload-asset-preview.svelte';

  let showDetail = true;
  let uploadLength = 0;
  let isUploading = false;

  // Reactive action to update asset uploadLength whenever there is a new one added to the list
  $: {
    if ($uploadAssetsStore.length != uploadLength) {
      uploadLength = $uploadAssetsStore.length;
    }
  }

  uploadAssetsStore.isUploading.subscribe((value) => {
    isUploading = value;
  });
</script>

{#if isUploading}
  <div
    in:fade={{ duration: 250 }}
    out:fade={{ duration: 250, delay: 1000 }}
    on:outroend={() => {
      notificationController.show({
        message: 'Upload success, refresh the page to see new upload assets',
        type: NotificationType.Info,
      });
    }}
    class="absolute bottom-6 right-6 z-[10000]"
  >
    {#if showDetail}
      <div
        in:scale={{ duration: 250, easing: quartInOut }}
        class="w-[300px] rounded-lg border bg-gray-200 p-4 text-sm shadow-sm"
      >
        <div class="place-item-center mb-4 flex justify-between">
          <p class="text-xs text-gray-500">UPLOADING {$uploadAssetsStore.length}</p>
          <button
            on:click={() => (showDetail = false)}
            class="flex h-[20px] w-[20px] place-content-center place-items-center rounded-full bg-gray-50 transition-colors hover:bg-gray-100"
          >
            <WindowMinimize />
          </button>
        </div>

        <div class="immich-scrollbar max-h-[400px] overflow-y-auto rounded-lg pr-2">
          {#each $uploadAssetsStore as uploadAsset}
            {#key uploadAsset.id}
              <UploadAssetPreview {uploadAsset} />
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
          {$uploadAssetsStore.length}
        </button>
        <button
          in:scale={{ duration: 250, easing: quartInOut }}
          on:click={() => (showDetail = true)}
          class="flex h-16 w-16 place-content-center place-items-center rounded-full bg-gray-300 p-5 text-sm shadow-lg"
        >
          <div class="animate-pulse">
            <CloudUploadOutline size="30" color="#4250af" />
          </div>
        </button>
      </div>
    {/if}
  </div>
{/if}
