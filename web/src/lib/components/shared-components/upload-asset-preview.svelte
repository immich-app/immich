<script lang="ts">
  import Icon from '$lib/components/elements/icon.svelte';
  import { AppRoute } from '$lib/constants';
  import type { UploadAsset } from '$lib/models/upload-asset';
  import { UploadState } from '$lib/models/upload-asset';
  import { locale } from '$lib/stores/preferences.store';
  import { uploadAssetsStore } from '$lib/stores/upload';
  import { getByteUnitString } from '$lib/utils/byte-units';
  import { fileUploadHandler } from '$lib/utils/file-uploader';
  import {
    mdiAlertCircle,
    mdiCheckCircle,
    mdiCircleOutline,
    mdiClose,
    mdiLoading,
    mdiOpenInNew,
    mdiRestart,
    mdiTrashCan,
  } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';

  export let uploadAsset: UploadAsset;

  const handleDismiss = (uploadAsset: UploadAsset) => {
    uploadAssetsStore.removeItem(uploadAsset.id);
  };

  const handleRetry = async (uploadAsset: UploadAsset) => {
    uploadAssetsStore.removeItem(uploadAsset.id);
    await fileUploadHandler([uploadAsset.file], uploadAsset.albumId);
  };

  const asLink = (asset: UploadAsset) => {
    return asset.isTrashed ? `${AppRoute.TRASH}/${asset.assetId}` : `${AppRoute.PHOTOS}/${uploadAsset.assetId}`;
  };
</script>

<div
  in:fade={{ duration: 250 }}
  out:fade={{ duration: 100 }}
  class="flex flex-col rounded-lg bg-immich-bg text-xs dark:bg-immich-dark-bg p-2 gap-1"
>
  <div class="flex items-center gap-2">
    <div class="flex items-center justify-center">
      {#if uploadAsset.state === UploadState.PENDING}
        <Icon path={mdiCircleOutline} size="24" class="text-immich-primary" title={$t('pending')} />
      {:else if uploadAsset.state === UploadState.STARTED}
        <Icon path={mdiLoading} size="24" spin class="text-immich-primary" title={$t('asset_skipped')} />
      {:else if uploadAsset.state === UploadState.ERROR}
        <Icon path={mdiAlertCircle} size="24" class="text-immich-error" title={$t('error')} />
      {:else if uploadAsset.state === UploadState.DUPLICATED}
        {#if uploadAsset.isTrashed}
          <Icon path={mdiTrashCan} size="24" class="text-gray-500" title={$t('asset_skipped_in_trash')} />
        {:else}
          <Icon path={mdiAlertCircle} size="24" class="text-immich-warning" title={$t('asset_skipped')} />
        {/if}
      {:else if uploadAsset.state === UploadState.DONE}
        <Icon path={mdiCheckCircle} size="24" class="text-immich-success" title={$t('asset_uploaded')} />
      {/if}
    </div>
    <!-- <span>[{getByteUnitString(uploadAsset.file.size, $locale)}]</span> -->
    <span class="grow break-all">{uploadAsset.file.name}</span>

    {#if uploadAsset.state === UploadState.DUPLICATED && uploadAsset.assetId}
      <div class="flex items-center justify-between gap-1">
        <a
          href={asLink(uploadAsset)}
          target="_blank"
          rel="noopener noreferrer"
          class=""
          aria-hidden="true"
          tabindex={-1}
        >
          <Icon path={mdiOpenInNew} size="20" />
        </a>
        <button type="button" on:click={() => handleDismiss(uploadAsset)} class="" aria-hidden="true" tabindex={-1}>
          <Icon path={mdiClose} size="20" />
        </button>
      </div>
    {:else if uploadAsset.state === UploadState.ERROR}
      <div class="flex items-center justify-between gap-1">
        <button type="button" on:click={() => handleRetry(uploadAsset)} class="" aria-hidden="true" tabindex={-1}>
          <Icon path={mdiRestart} size="20" />
        </button>
        <button type="button" on:click={() => handleDismiss(uploadAsset)} class="" aria-hidden="true" tabindex={-1}>
          <Icon path={mdiClose} size="20" />
        </button>
      </div>
    {/if}
  </div>

  {#if uploadAsset.state === UploadState.STARTED}
    <div class="text-black relative mt-[5px] h-[15px] w-full rounded-md bg-gray-300 dark:bg-immich-dark-gray">
      <div class="h-[15px] rounded-md bg-immich-primary transition-all" style={`width: ${uploadAsset.progress}%`} />
      <p class="absolute top-0 h-full w-full text-center text-[10px]">
        {#if uploadAsset.message}
          {uploadAsset.message}
        {:else}
          {uploadAsset.progress}% - {getByteUnitString(uploadAsset.speed || 0, $locale)}/s - {uploadAsset.eta}s
        {/if}
      </p>
    </div>
  {/if}

  {#if uploadAsset.state === UploadState.ERROR}
    <div class="flex flex-row justify-between">
      <p class="w-full rounded-md text-justify text-immich-error">
        {uploadAsset.error}
      </p>
    </div>
  {/if}
</div>
