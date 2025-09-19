<script lang="ts">
  import { goto } from '$app/navigation';
  import empty3Url from '$lib/assets/empty-3.svg';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import EmptyPlaceholder from '$lib/components/shared-components/empty-placeholder.svelte';
  import {
    notificationController,
    NotificationType,
  } from '$lib/components/shared-components/notification/notification';
  import DeleteAssets from '$lib/components/timeline/actions/DeleteAssetsAction.svelte';
  import RestoreAssets from '$lib/components/timeline/actions/RestoreAction.svelte';
  import SelectAllAssets from '$lib/components/timeline/actions/SelectAllAction.svelte';
  import AssetSelectControlBar from '$lib/components/timeline/AssetSelectControlBar.svelte';
  import Timeline from '$lib/components/timeline/Timeline.svelte';
  import { AppRoute } from '$lib/constants';
  import { TimelineManager } from '$lib/managers/timeline-manager/timeline-manager.svelte';
  import { AssetInteraction } from '$lib/stores/asset-interaction.svelte';
  import { featureFlags, serverConfig } from '$lib/stores/server-config.store';
  import { handlePromiseError } from '$lib/utils';
  import { handleError } from '$lib/utils/handle-error';
  import { emptyTrash, restoreTrash } from '@immich/sdk';
  import { Button, HStack, modalManager, Text } from '@immich/ui';
  import { mdiDeleteForeverOutline, mdiHistory } from '@mdi/js';
  import { onDestroy } from 'svelte';
  import { t } from 'svelte-i18n';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  if (!$featureFlags.trash) {
    handlePromiseError(goto(AppRoute.PHOTOS));
  }

  const timelineManager = new TimelineManager();
  void timelineManager.updateOptions({ isTrashed: true });
  onDestroy(() => timelineManager.destroy());

  const assetInteraction = new AssetInteraction();

  const handleEmptyTrash = async () => {
    const isConfirmed = await modalManager.showDialog({ prompt: $t('empty_trash_confirmation') });
    if (!isConfirmed) {
      return;
    }

    try {
      const { count } = await emptyTrash();

      notificationController.show({
        message: $t('assets_permanently_deleted_count', { values: { count } }),
        type: NotificationType.Info,
      });
    } catch (error) {
      handleError(error, $t('errors.unable_to_empty_trash'));
    }
  };

  const handleRestoreTrash = async () => {
    const isConfirmed = await modalManager.showDialog({ prompt: $t('assets_restore_confirmation') });
    if (!isConfirmed) {
      return;
    }
    try {
      const { count } = await restoreTrash();
      notificationController.show({
        message: $t('assets_restored_count', { values: { count } }),
        type: NotificationType.Info,
      });

      // reset asset grid (TODO fix in asset store that it should reset when it is empty)
      // note - this is still a problem, but updateOptions with the same value will not
      // do anything, so need to flip it for it to reload/reinit
      // await timelineManager.updateOptions({ deferInit: true, isTrashed: true });
      // await timelineManager.updateOptions({ deferInit: false, isTrashed: true });
    } catch (error) {
      handleError(error, $t('errors.unable_to_restore_trash'));
    }
  };

  const handleEscape = () => {
    if (assetInteraction.selectionActive) {
      assetInteraction.clearMultiselect();
      return;
    }
  };
</script>

{#if $featureFlags.loaded && $featureFlags.trash}
  <UserPageLayout hideNavbar={assetInteraction.selectionActive} title={data.meta.title} scrollbar={false}>
    {#snippet buttons()}
      <HStack gap={0}>
        <Button
          leadingIcon={mdiHistory}
          onclick={handleRestoreTrash}
          disabled={assetInteraction.selectionActive}
          variant="ghost"
          color="secondary"
          size="small"
        >
          <Text class="hidden md:block">{$t('restore_all')}</Text>
        </Button>
        <Button
          leadingIcon={mdiDeleteForeverOutline}
          onclick={() => handleEmptyTrash()}
          disabled={assetInteraction.selectionActive}
          variant="ghost"
          color="secondary"
          size="small"
        >
          <Text class="hidden md:block">{$t('empty_trash')}</Text>
        </Button>
      </HStack>
    {/snippet}

    <Timeline enableRouting={true} {timelineManager} {assetInteraction} onEscape={handleEscape}>
      <p class="font-medium text-gray-500/60 dark:text-gray-300/60 p-4">
        {$t('trashed_items_will_be_permanently_deleted_after', { values: { days: $serverConfig.trashDays } })}
      </p>
      {#snippet empty()}
        <EmptyPlaceholder text={$t('trash_no_results_message')} src={empty3Url} />
      {/snippet}
    </Timeline>
  </UserPageLayout>
{/if}

{#if assetInteraction.selectionActive}
  <AssetSelectControlBar
    assets={assetInteraction.selectedAssets}
    clearSelect={() => assetInteraction.clearMultiselect()}
  >
    <SelectAllAssets {timelineManager} {assetInteraction} />
    <DeleteAssets force onAssetDelete={(assetIds) => timelineManager.removeAssets(assetIds)} />
    <RestoreAssets onRestore={(assetIds) => timelineManager.removeAssets(assetIds)} />
  </AssetSelectControlBar>
{/if}
