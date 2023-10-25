<script lang="ts">
  import type { UploadAsset } from '$lib/models/upload-asset';
  import { UploadState } from '$lib/models/upload-asset';
  import { locale } from '$lib/stores/preferences.store';
  import { asByteUnitString } from '$lib/utils/byte-units';
  import { fade } from 'svelte/transition';
  import ImmichLogo from './immich-logo.svelte';
  import { getFilenameExtension } from '$lib/utils/asset-utils';
  import { uploadAssetsStore } from '$lib/stores/upload';
  import Icon from '$lib/components/elements/icon.svelte';
  import { fileUploadHandler } from '$lib/utils/file-uploader';
  import { mdiRefresh, mdiCancel } from '@mdi/js';

  export let uploadAsset: UploadAsset;

  const handleRetry = (uploadAsset: UploadAsset) => {
    uploadAssetsStore.removeUploadAsset(uploadAsset.id);
    fileUploadHandler([uploadAsset.file], uploadAsset.albumId);
  };
</script>

<div
  in:fade={{ duration: 250 }}
  out:fade={{ duration: 100 }}
  class="flex flex-col rounded-lg bg-immich-bg text-xs dark:bg-immich-dark-bg"
>
  <div class="grid grid-cols-[65px_auto_auto]">
    <div class="relative h-[65px]">
      <div in:fade={{ duration: 250 }}>
        <ImmichLogo class="h-[65px] w-[65px] rounded-bl-lg rounded-tl-lg object-cover p-2" />
      </div>
      <div class="absolute bottom-0 left-0 h-[25px] w-full rounded-bl-md bg-immich-primary/30">
        <p
          class="absolute bottom-1 right-1 stroke-immich-primary object-right-bottom font-semibold uppercase text-white/95 dark:text-gray-100"
        >
          .{getFilenameExtension(uploadAsset.file.name)}
        </p>
      </div>
    </div>
    <div class="flex flex-col justify-between p-2 pr-2">
      <input
        disabled
        class="w-full rounded-md border bg-gray-100 p-1 px-2 text-[10px] dark:border-immich-dark-gray dark:bg-gray-900"
        value={`[${asByteUnitString(uploadAsset.file.size, $locale)}] ${uploadAsset.file.name}`}
      />

      <div
        class="relative mt-[5px] h-[15px] w-full rounded-md bg-gray-300 text-white dark:bg-immich-dark-gray dark:text-black"
      >
        {#if uploadAsset.state === UploadState.STARTED}
          <div class="h-[15px] rounded-md bg-immich-primary transition-all" style={`width: ${uploadAsset.progress}%`} />
          <p class="absolute top-0 h-full w-full text-center text-[10px]">
            {#if uploadAsset.message}
              {uploadAsset.message}
            {:else}
              {uploadAsset.progress}/100 - {asByteUnitString(uploadAsset.speed || 0, $locale)}/s - {uploadAsset.eta}s
            {/if}
          </p>
        {:else if uploadAsset.state === UploadState.PENDING}
          <div class="h-[15px] rounded-md bg-immich-dark-gray transition-all dark:bg-immich-gray" style="width: 100%" />
          <p class="absolute top-0 h-full w-full text-center text-[10px]">Pending</p>
        {:else if uploadAsset.state === UploadState.ERROR}
          <div class="h-[15px] rounded-md bg-immich-error transition-all" style="width: 100%" />
          <p class="absolute top-0 h-full w-full text-center text-[10px]">Error</p>
        {:else if uploadAsset.state === UploadState.DUPLICATED}
          <div class="h-[15px] rounded-md bg-immich-warning transition-all" style="width: 100%" />
          <p class="absolute top-0 h-full w-full text-center text-[10px]">
            Skipped
            {#if uploadAsset.message} ({uploadAsset.message}){/if}
          </p>
        {:else if uploadAsset.state === UploadState.DONE}
          <div class="h-[15px] rounded-md bg-immich-success transition-all" style="width: 100%" />
          <p class="absolute top-0 h-full w-full text-center text-[10px]">
            Uploaded
            {#if uploadAsset.message} ({uploadAsset.message}){/if}
          </p>
        {/if}
      </div>
    </div>
    {#if uploadAsset.state === UploadState.ERROR}
      <div class="flex h-full flex-col place-content-center place-items-center justify-items-center pr-2">
        <button
          on:click={() => handleRetry(uploadAsset)}
          title="Retry upload"
          class="flex h-full w-full place-content-center place-items-center text-sm"
        >
          <span class="text-immich-dark-gray dark:text-immich-dark-fg"><Icon path={mdiRefresh} size="20" /></span>
        </button>
        <button
          on:click={() => uploadAssetsStore.removeUploadAsset(uploadAsset.id)}
          title="Dismiss error"
          class="flex h-full w-full place-content-center place-items-center text-sm"
        >
          <span class="text-immich-error"><Icon path={mdiCancel} size="20" /></span>
        </button>
      </div>
    {/if}
  </div>

  {#if uploadAsset.state === UploadState.ERROR}
    <div class="flex flex-row justify-between">
      <p class="w-full rounded-md p-1 px-2 text-justify text-[10px] text-immich-error">
        {uploadAsset.error}
      </p>
    </div>
  {/if}
</div>
