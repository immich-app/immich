<script lang="ts">
  import { goto } from '$app/navigation';
  import { AppRoute } from '$lib/constants';
  import { dragAndDropFilesStore } from '$lib/stores/drag-and-drop-files.store';
  import { getKey, handlePromiseError } from '$lib/utils';
  import { downloadArchive } from '$lib/utils/asset-utils';
  import { fileUploadHandler, openFileUploadDialog } from '$lib/utils/file-uploader';
  import { handleError } from '$lib/utils/handle-error';
  import { addSharedLinkAssets, type AssetResponseDto, type SharedLinkResponseDto } from '@immich/sdk';
  import { mdiArrowLeft, mdiFileImagePlusOutline, mdiFolderDownloadOutline, mdiSelectAll } from '@mdi/js';
  import CircleIconButton from '../elements/buttons/circle-icon-button.svelte';
  import DownloadAction from '../photos-page/actions/download-action.svelte';
  import RemoveFromSharedLink from '../photos-page/actions/remove-from-shared-link.svelte';
  import AssetSelectControlBar from '../photos-page/asset-select-control-bar.svelte';
  import ControlAppBar from '../shared-components/control-app-bar.svelte';
  import GalleryViewer from '../shared-components/gallery-viewer/gallery-viewer.svelte';
  import ImmichLogoSmallLink from '$lib/components/shared-components/immich-logo-small-link.svelte';
  import { NotificationType, notificationController } from '../shared-components/notification/notification';
  import type { Viewport } from '$lib/stores/assets.store';
  import { t } from 'svelte-i18n';

  export let sharedLink: SharedLinkResponseDto;
  export let isOwned: boolean;

  const viewport: Viewport = { width: 0, height: 0 };
  let selectedAssets: Set<AssetResponseDto> = new Set();
  let innerWidth: number;

  $: assets = sharedLink.assets;
  $: isMultiSelectionMode = selectedAssets.size > 0;

  dragAndDropFilesStore.subscribe((value) => {
    if (value.isDragging && value.files.length > 0) {
      handlePromiseError(handleUploadAssets(value.files));
      dragAndDropFilesStore.set({ isDragging: false, files: [] });
    }
  });

  const downloadAssets = async () => {
    await downloadArchive(`immich-shared.zip`, { assetIds: assets.map((asset) => asset.id) });
  };

  const handleUploadAssets = async (files: File[] = []) => {
    try {
      let results: (string | undefined)[] = [];
      results = await (!files || files.length === 0 || !Array.isArray(files)
        ? openFileUploadDialog()
        : fileUploadHandler(files));
      const data = await addSharedLinkAssets({
        id: sharedLink.id,
        assetIdsDto: {
          assetIds: results.filter((id) => !!id) as string[],
        },
        key: getKey(),
      });

      const added = data.filter((item) => item.success).length;

      notificationController.show({
        message: $t('assets_added_count', { values: { count: added } }),
        type: NotificationType.Info,
      });
    } catch (error) {
      handleError(error, $t('errors.unable_to_add_assets_to_shared_link'));
    }
  };

  const handleSelectAll = () => {
    selectedAssets = new Set(assets);
  };
</script>

<svelte:window bind:innerWidth />

<section class="bg-immich-bg dark:bg-immich-dark-bg">
  {#if isMultiSelectionMode}
    <AssetSelectControlBar assets={selectedAssets} clearSelect={() => (selectedAssets = new Set())}>
      <CircleIconButton title={$t('select_all')} icon={mdiSelectAll} on:click={handleSelectAll} />
      {#if sharedLink?.allowDownload}
        <DownloadAction filename="immich-shared.zip" />
      {/if}
      {#if isOwned}
        <RemoveFromSharedLink bind:sharedLink />
      {/if}
    </AssetSelectControlBar>
  {:else}
    <ControlAppBar onClose={() => goto(AppRoute.PHOTOS)} backIcon={mdiArrowLeft} showBackButton={false}>
      <svelte:fragment slot="leading">
        <ImmichLogoSmallLink width={innerWidth} />
      </svelte:fragment>

      <svelte:fragment slot="trailing">
        {#if sharedLink?.allowUpload}
          <CircleIconButton
            title={$t('add_photos')}
            on:click={() => handleUploadAssets()}
            icon={mdiFileImagePlusOutline}
          />
        {/if}

        {#if sharedLink?.allowDownload}
          <CircleIconButton title={$t('download')} on:click={downloadAssets} icon={mdiFolderDownloadOutline} />
        {/if}
      </svelte:fragment>
    </ControlAppBar>
  {/if}
  <section class="my-[160px] mx-4" bind:clientHeight={viewport.height} bind:clientWidth={viewport.width}>
    <GalleryViewer {assets} bind:selectedAssets {viewport} />
  </section>
</section>
