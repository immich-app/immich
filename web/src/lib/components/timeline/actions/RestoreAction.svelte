<script lang="ts">
  import { getAssetControlContext } from '$lib/components/timeline/AssetSelectControlBar.svelte';
  import type { OnRestore } from '$lib/utils/actions';
  import { handleError } from '$lib/utils/handle-error';
  import { restoreAssets } from '@immich/sdk';
  import { Button, toastManager } from '@immich/ui';
  import { mdiHistory } from '@mdi/js';
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
      toastManager.success($t('assets_restored_count', { values: { count: ids.length } }));
      clearSelect();
    } catch (error) {
      handleError(error, $t('errors.unable_to_restore_assets'));
    } finally {
      loading = false;
    }
  };
</script>

<Button
  leadingIcon={mdiHistory}
  disabled={loading}
  size="medium"
  color="secondary"
  variant="ghost"
  onclick={handleRestore}
>
  {$t('restore')}
</Button>
