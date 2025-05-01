<script lang="ts">
  import { goto } from '$app/navigation';
  import type { Action } from '$lib/components/asset-viewer/actions/action';
  import ImmichLogoSmallLink from '$lib/components/shared-components/immich-logo-small-link.svelte';
  import { AppRoute, AssetAction } from '$lib/constants';
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import { AssetInteraction } from '$lib/stores/asset-interaction.svelte';
  import type { Viewport } from '$lib/stores/assets-store.svelte';
  import { dragAndDropFilesStore } from '$lib/stores/drag-and-drop-files.store';
  import { handlePromiseError } from '$lib/utils';
  import { cancelMultiselect, downloadArchive } from '$lib/utils/asset-utils';
  import { fileUploadHandler, openFileUploadDialog } from '$lib/utils/file-uploader';
  import { handleError } from '$lib/utils/handle-error';
  import { addSharedLinkAssets, type SharedLinkResponseDto } from '@immich/sdk';
  import { mdiArrowLeft, mdiFileImagePlusOutline, mdiFolderDownloadOutline, mdiSelectAll } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import AssetViewer from '../asset-viewer/asset-viewer.svelte';
  import CircleIconButton from '../elements/buttons/circle-icon-button.svelte';
  import DownloadAction from '../photos-page/actions/download-action.svelte';
  import RemoveFromSharedLink from '../photos-page/actions/remove-from-shared-link.svelte';
  import AssetSelectControlBar from '../photos-page/asset-select-control-bar.svelte';
  import ControlAppBar from '../shared-components/control-app-bar.svelte';
  import GalleryViewer from '../shared-components/gallery-viewer/gallery-viewer.svelte';
  import { NotificationType, notificationController } from '../shared-components/notification/notification';

  interface Props {
    sharedLink: SharedLinkResponseDto;
    isOwned: boolean;
  }

  let { sharedLink = $bindable(), isOwned }: Props = $props();

  const viewport: Viewport = $state({ width: 0, height: 0 });
  const assetInteraction = new AssetInteraction();

  let assets = $derived(sharedLink.assets);

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
        key: authManager.key,
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
    assetInteraction.selectAssets(assets);
  };

  const handleAction = async (action: Action) => {
    switch (action.type) {
      case AssetAction.ARCHIVE:
      case AssetAction.DELETE:
      case AssetAction.TRASH: {
        await goto(AppRoute.PHOTOS);
        break;
      }
    }
  };
</script>

<section class="bg-immich-bg dark:bg-immich-dark-bg">
  {#if sharedLink?.allowUpload || assets.length > 1}
    {#if assetInteraction.selectionActive}
      <AssetSelectControlBar
        assets={assetInteraction.selectedAssets}
        clearSelect={() => cancelMultiselect(assetInteraction)}
      >
        <CircleIconButton title={$t('select_all')} icon={mdiSelectAll} onclick={handleSelectAll} />
        {#if sharedLink?.allowDownload}
          <DownloadAction filename="immich-shared.zip" />
        {/if}
        {#if isOwned}
          <RemoveFromSharedLink bind:sharedLink />
        {/if}
      </AssetSelectControlBar>
    {:else}
      <ControlAppBar onClose={() => goto(AppRoute.PHOTOS)} backIcon={mdiArrowLeft} showBackButton={false}>
        {#snippet leading()}
          <ImmichLogoSmallLink />
        {/snippet}

        {#snippet trailing()}
          {#if sharedLink?.allowUpload}
            <CircleIconButton
              title={$t('add_photos')}
              onclick={() => handleUploadAssets()}
              icon={mdiFileImagePlusOutline}
            />
          {/if}

          {#if sharedLink?.allowDownload}
            <CircleIconButton title={$t('download')} onclick={downloadAssets} icon={mdiFolderDownloadOutline} />
          {/if}
        {/snippet}
      </ControlAppBar>
    {/if}
    <section class="my-[160px] mx-4" bind:clientHeight={viewport.height} bind:clientWidth={viewport.width}>
      <GalleryViewer {assets} {assetInteraction} {viewport} />
    </section>
  {:else}
    <AssetViewer
      asset={assets[0]}
      showCloseButton={false}
      onAction={handleAction}
      onPrevious={() => Promise.resolve(false)}
      onNext={() => Promise.resolve(false)}
      onRandom={() => Promise.resolve(undefined)}
      onClose={() => {}}
    />
  {/if}
</section>
