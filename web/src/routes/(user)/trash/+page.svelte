<script lang="ts">
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import DeleteAssets from '$lib/components/photos-page/actions/delete-assets.svelte';
  import RestoreAssets from '$lib/components/photos-page/actions/restore-assets.svelte';
  import SelectAllAssets from '$lib/components/photos-page/actions/select-all-assets.svelte';
  import AssetGrid from '$lib/components/photos-page/asset-grid.svelte';
  import AssetSelectControlBar from '$lib/components/photos-page/asset-select-control-bar.svelte';
  import EmptyPlaceholder from '$lib/components/shared-components/empty-placeholder.svelte';
  import { AppRoute } from '$lib/constants';
  import { createAssetInteractionStore } from '$lib/stores/asset-interaction.store';
  import { handleError } from '$lib/utils/handle-error';
  import {
    NotificationType,
    notificationController,
  } from '$lib/components/shared-components/notification/notification';
  import LinkButton from '$lib/components/elements/buttons/link-button.svelte';
  import { AssetStore } from '$lib/stores/assets.store';
  import { api, TimeBucketSize } from '@api';
  import DeleteOutline from 'svelte-material-icons/DeleteOutline.svelte';
  import HistoryOutline from 'svelte-material-icons/History.svelte';
  import type { PageData } from './$types';
  import { featureFlags, serverConfig } from '$lib/stores/server-config.store';
  import { goto } from '$app/navigation';
  import empty3Url from '$lib/assets/empty-3.svg';
  import ConfirmDialogue from '$lib/components/shared-components/confirm-dialogue.svelte';

  export let data: PageData;

  $: $featureFlags.trash || goto(AppRoute.PHOTOS);

  const assetStore = new AssetStore({ size: TimeBucketSize.Month, isTrashed: true });
  const assetInteractionStore = createAssetInteractionStore();
  const { isMultiSelectState, selectedAssets } = assetInteractionStore;
  let isShowEmptyConfirmation = false;

  const handleEmptyTrash = async () => {
    isShowEmptyConfirmation = false;
    try {
      await api.assetApi.emptyTrash();

      notificationController.show({
        message: `Empty trash initiated. Refresh the page to see the changes`,
        type: NotificationType.Info,
      });
    } catch (e) {
      handleError(e, 'Error emptying trash');
    }
  };

  const handleRestoreTrash = async () => {
    try {
      await api.assetApi.restoreTrash();

      notificationController.show({
        message: `Restore trash initiated. Refresh the page to see the changes`,
        type: NotificationType.Info,
      });
    } catch (e) {
      handleError(e, 'Error restoring trash');
    }
  };
</script>

{#if $isMultiSelectState}
  <AssetSelectControlBar assets={$selectedAssets} clearSelect={() => assetInteractionStore.clearMultiselect()}>
    <SelectAllAssets {assetStore} {assetInteractionStore} />
    <DeleteAssets force onAssetDelete={(assetId) => assetStore.removeAsset(assetId)} />
    <RestoreAssets onRestore={(ids) => assetStore.removeAssets(ids)} />
  </AssetSelectControlBar>
{/if}

{#if $featureFlags.loaded && $featureFlags.trash}
  <UserPageLayout user={data.user} hideNavbar={$isMultiSelectState} title={data.meta.title}>
    <div class="flex place-items-center gap-2" slot="buttons">
      <LinkButton on:click={handleRestoreTrash}>
        <div class="flex place-items-center gap-2 text-sm">
          <HistoryOutline size="18" />
          Restore All
        </div>
      </LinkButton>
      <LinkButton on:click={() => (isShowEmptyConfirmation = true)}>
        <div class="flex place-items-center gap-2 text-sm">
          <DeleteOutline size="18" />
          Empty Trash
        </div>
      </LinkButton>
    </div>

    <AssetGrid forceDelete {assetStore} {assetInteractionStore}>
      <p class="font-medium text-gray-500/60 dark:text-gray-300/60">
        Trashed items will be permanently deleted after {$serverConfig.trashDays} days.
      </p>
      <EmptyPlaceholder
        text="Trashed photos and videos will show up here."
        alt="Empty trash can"
        slot="empty"
        src={empty3Url}
      />
    </AssetGrid>
  </UserPageLayout>
{/if}

{#if isShowEmptyConfirmation}
  <ConfirmDialogue
    title="Empty Trash"
    confirmText="Empty"
    on:confirm={handleEmptyTrash}
    on:cancel={() => (isShowEmptyConfirmation = false)}
  >
    <svelte:fragment slot="prompt">
      <p>Are you sure you want to empty the trash? This will remove all the assets in trash permanently from Immich.</p>
      <p><b>You cannot undo this action!</b></p>
    </svelte:fragment>
  </ConfirmDialogue>
{/if}
