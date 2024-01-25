<script lang="ts">
  import {
    NotificationType,
    notificationController,
  } from '$lib/components/shared-components/notification/notification';
  import { handleError } from '$lib/utils/handle-error';
  import { api } from '@api';
  import Icon from '$lib/components/elements/icon.svelte';
  import Button from '../../elements/buttons/button.svelte';
  import { getAssetControlContext } from '../asset-select-control-bar.svelte';
  import { mdiHistory } from '@mdi/js';
  import type { OnRestore } from '$lib/utils/actions';

  export let onRestore: OnRestore | undefined = undefined;

  const { getAssets, clearSelect } = getAssetControlContext();

  let loading = false;

  const handleRestore = async () => {
    loading = true;

    try {
      const ids = Array.from(getAssets()).map((a) => a.id);
      await api.assetApi.restoreAssets({ bulkIdsDto: { ids } });
      onRestore?.(ids);

      notificationController.show({
        message: `Restored ${ids.length}`,
        type: NotificationType.Info,
      });

      clearSelect();
    } catch (e) {
      handleError(e, 'Error restoring assets');
    } finally {
      loading = false;
    }
  };
</script>

<Button disabled={loading} size="sm" color="transparent-gray" shadow={false} rounded="lg" on:click={handleRestore}>
  <Icon path={mdiHistory} size="24" />
  <span class="ml-2">Restore</span>
</Button>
