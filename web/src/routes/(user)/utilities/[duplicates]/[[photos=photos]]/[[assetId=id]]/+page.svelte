<script lang="ts">
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import DuplicatesCompareControl from '$lib/components/utilities-page/duplicates/duplicates-compare-control.svelte';
  import { resolveDuplicates } from '@immich/sdk';

  import type { PageData } from './$types';
  import { handleError } from '$lib/utils/handle-error';
  import {
    NotificationType,
    notificationController,
  } from '$lib/components/shared-components/notification/notification';
  export let data: PageData;

  const handleOnResolve = async (duplicateId: string, trashIds: string[]) => {
    try {
      await resolveDuplicates({ resolveDuplicatesDto: { duplicateId, ids: trashIds } });
      data.duplicates = data.duplicates.filter((duplicate) => duplicate.duplicateId !== duplicateId);

      if (trashIds.length === 0) {
        return;
      }

      notificationController.show({
        message: `Moved ${trashIds.length} to trash`,
        type: NotificationType.Info,
      });
    } catch (error) {
      handleError(error, 'Unable to resolve duplicate');
    }
  };
</script>

<UserPageLayout title={data.meta.title + ` (${data.duplicates.length})`} scrollbar={true}>
  <div class="mt-6">
    {#each data.duplicates as duplicate (duplicate.duplicateId)}
      <DuplicatesCompareControl {duplicate} onResolve={(ids) => handleOnResolve(duplicate.duplicateId, ids)} />
    {/each}
  </div>
</UserPageLayout>
