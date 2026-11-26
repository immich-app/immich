<script lang="ts">
  import { assetMultiSelectManager } from '#lib/managers/asset-multi-select-manager.svelte.ts';
  import { restoreAssetsMutation } from '#lib/queries/trash.query.ts';
  import type { OnRestore } from '#lib/utils/actions.ts';
  import { Button, toastManager } from '@immich/ui';
  import { mdiHistory } from '@mdi/js';
  import { createMutation } from '@tanstack/svelte-query';
  import { noop } from 'lodash-es';
  import { t } from 'svelte-i18n';

  interface Props {
    onRestore: OnRestore | undefined;
  }

  let { onRestore }: Props = $props();

  const restoreAssets = createMutation(restoreAssetsMutation);

  const handleRestore = async () => {
    const ids = assetMultiSelectManager.assets.map((a) => a.id);
    await restoreAssets
      .mutateAsync([{ bulkIdsDto: { ids } }])
      .then(() => {
        onRestore?.(ids);
        toastManager.primary($t('assets_restored_count', { values: { count: ids.length } }));
        assetMultiSelectManager.clear();
      })
      .catch(noop);
  };
</script>

<Button
  leadingIcon={mdiHistory}
  disabled={restoreAssets.isPending}
  size="medium"
  color="secondary"
  variant="ghost"
  onclick={handleRestore}
>
  {$t('restore')}
</Button>
