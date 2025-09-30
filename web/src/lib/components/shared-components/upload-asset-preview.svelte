<script lang="ts">
  import { AppRoute } from '$lib/constants';
  import type { UploadAsset } from '$lib/models/upload-asset';
  import { UploadState } from '$lib/models/upload-asset';
  import { locale } from '$lib/stores/preferences.store';
  import { uploadAssetsStore } from '$lib/stores/upload';
  import { getByteUnitString } from '$lib/utils/byte-units';
  import { fileUploadHandler } from '$lib/utils/file-uploader';
  import { Icon } from '@immich/ui';
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

  interface Props {
    uploadAsset: UploadAsset;
  }

  let { uploadAsset }: Props = $props();

  const handleDismiss = (uploadAsset: UploadAsset) => {
    uploadAssetsStore.removeItem(uploadAsset.id);
  };

  const handleRetry = async (uploadAsset: UploadAsset) => {
    uploadAssetsStore.removeItem(uploadAsset.id);
    await fileUploadHandler({ files: [uploadAsset.file], albumId: uploadAsset.albumId });
  };

  const asLink = (asset: UploadAsset) => {
    return asset.isTrashed ? `${AppRoute.TRASH}/${asset.assetId}` : `${AppRoute.PHOTOS}/${uploadAsset.assetId}`;
  };
</script>

<div in:fade={{ duration: 250 }} out:fade={{ duration: 100 }} class="flex flex-col rounded-lg text-xs p-2 gap-1">
  <div class="flex items-center gap-2">
    <div class="flex items-center justify-center">
      {#if uploadAsset.state === UploadState.PENDING}
        <Icon icon={mdiCircleOutline} size="24" class="text-primary" title={$t('pending')} />
      {:else if uploadAsset.state === UploadState.STARTED}
        <Icon icon={mdiLoading} size="24" spin class="text-primary" title={$t('asset_skipped')} />
      {:else if uploadAsset.state === UploadState.ERROR}
        <Icon icon={mdiAlertCircle} size="24" class="text-danger" title={$t('error')} />
      {:else if uploadAsset.state === UploadState.DUPLICATED}
        {#if uploadAsset.isTrashed}
          <Icon icon={mdiTrashCan} size="24" class="text-gray-500" title={$t('asset_skipped_in_trash')} />
        {:else}
          <Icon icon={mdiAlertCircle} size="24" class="text-warning" title={$t('asset_skipped')} />
        {/if}
      {:else if uploadAsset.state === UploadState.DONE}
        <Icon icon={mdiCheckCircle} size="24" class="text-success" title={$t('asset_uploaded')} />
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
          <Icon icon={mdiOpenInNew} size="20" />
        </a>
        <button type="button" onclick={() => handleDismiss(uploadAsset)} class="" aria-hidden="true" tabindex={-1}>
          <Icon icon={mdiClose} size="20" />
        </button>
      </div>
    {:else if uploadAsset.state === UploadState.ERROR}
      <div class="flex items-center justify-between gap-1">
        <button type="button" onclick={() => handleRetry(uploadAsset)} class="" aria-hidden="true" tabindex={-1}>
          <Icon icon={mdiRestart} size="20" />
        </button>
        <button type="button" onclick={() => handleDismiss(uploadAsset)} class="" aria-hidden="true" tabindex={-1}>
          <Icon icon={mdiClose} size="20" />
        </button>
      </div>
    {/if}
  </div>

  {#if uploadAsset.state === UploadState.STARTED}
    <div class="text-black relative mt-[5px] h-[15px] w-full rounded-md bg-gray-300 dark:bg-gray-700">
      <div class="h-[15px] rounded-md bg-immich-primary transition-all" style={`width: ${uploadAsset.progress}%`}></div>
      <p class="absolute top-0 h-full w-full text-center text-primary text-[10px]">
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
      <p class="w-full rounded-md text-justify text-danger">
        {uploadAsset.error}
      </p>
    </div>
  {/if}
</div>
