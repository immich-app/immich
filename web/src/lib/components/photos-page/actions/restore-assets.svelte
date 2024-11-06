<script lang="ts">
  import Icon from '$lib/components/elements/icon.svelte';
  import {
    NotificationType,
    notificationController,
  } from '$lib/components/shared-components/notification/notification';
  import type { OnRestore } from '$lib/utils/actions';
  import { handleError } from '$lib/utils/handle-error';
  import { restoreAssets } from '@immich/sdk';
  import { mdiHistory } from '@mdi/js';
  import Button from '../../elements/buttons/button.svelte';
  import { getAssetControlContext } from '../asset-select-control-bar.svelte';
  import { t } from 'svelte-i18n';

  interface Props {
    onRestore: OnRestore | undefined;
  }

  let { onRestore }: Props = $props();

  const { getAssets, clearSelect } = getAssetControlContext();

  let loading = $state(false);

  const handleRestore = async () => {
    loading = true;

    try {
      const ids = [...getAssets()].map((a) => a.id);
      await restoreAssets({ bulkIdsDto: { ids } });
      onRestore?.(ids);

      notificationController.show({
        message: $t('assets_restored_count', { values: { count: ids.length } }),
        type: NotificationType.Info,
      });

      clearSelect();
    } catch (error) {
      handleError(error, $t('errors.unable_to_restore_assets'));
    } finally {
      loading = false;
    }
  };
</script>

<Button disabled={loading} size="sm" color="transparent-gray" shadow={false} rounded="lg" onclick={handleRestore}>
  <Icon path={mdiHistory} size="24" />
  <span class="ml-2">{$t('restore')}</span>
</Button>
