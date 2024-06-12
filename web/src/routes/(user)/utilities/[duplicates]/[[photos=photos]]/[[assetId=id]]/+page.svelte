<script lang="ts">
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import DuplicatesCompareControl from '$lib/components/utilities-page/duplicates/duplicates-compare-control.svelte';

  import type { PageData } from './$types';
  import { handleError } from '$lib/utils/handle-error';
  import {
    NotificationType,
    notificationController,
  } from '$lib/components/shared-components/notification/notification';
  import { s } from '$lib/utils';
  import { deleteAssets, updateAssets } from '@immich/sdk';
  import { t } from 'svelte-i18n';
  import { featureFlags } from '$lib/stores/server-config.store';
  import { dialogController } from '$lib/components/shared-components/dialog/dialog';

  export let data: PageData;

  const handleResolve = async (duplicateId: string, duplicateAssetIds: string[], trashIds: string[]) => {
    try {
      if (!$featureFlags.trash && trashIds.length > 0) {
        const isConfirmed = await dialogController.show({
          title: 'Confirm',
          prompt: 'Are you sure you want to permanently delete these duplicates?',
          confirmText: 'Yes',
          cancelText: 'No',
        });

        if (!isConfirmed) {
          return;
        }
      }

      await updateAssets({ assetBulkUpdateDto: { ids: duplicateAssetIds, duplicateId: null } });
      await deleteAssets({ assetBulkDeleteDto: { ids: trashIds, force: !$featureFlags.trash } });

      data.duplicates = data.duplicates.filter((duplicate) => duplicate.duplicateId !== duplicateId);

      if (trashIds.length === 0) {
        return;
      }

      notificationController.show({
        message: `Moved ${trashIds.length} asset${s(trashIds.length)} to trash`,
        type: NotificationType.Info,
      });
    } catch (error) {
      handleError(error, $t('errors.unable_to_resolve_duplicate'));
    }
  };
</script>

<UserPageLayout title={data.meta.title + ` (${data.duplicates.length})`} scrollbar={true}>
  <div class="mt-4">
    {#if data.duplicates && data.duplicates.length > 0}
      <div class="mb-4 text-sm dark:text-white">
        <p>Resolve each group by indicating which, if any, are duplicates.</p>
      </div>
      {#key data.duplicates[0].duplicateId}
        <DuplicatesCompareControl
          duplicate={data.duplicates[0]}
          onResolve={(duplicateAssetIds, trashIds) =>
            handleResolve(data.duplicates[0].duplicateId, duplicateAssetIds, trashIds)}
        />
      {/key}
    {:else}
      <p class="text-center text-lg dark:text-white flex place-items-center place-content-center">
        {$t('no_duplicates_found')}
      </p>
    {/if}
  </div>
</UserPageLayout>
