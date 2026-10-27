<script lang="ts">
  import { shortcut } from '#lib/actions/shortcut.ts';
  import { assetMultiSelectManager } from '#lib/managers/asset-multi-select-manager.svelte.ts';
  import { executeMutation } from '#lib/queries/client.ts';
  import { removeSharedLinkAssetsMutation } from '#lib/queries/shared-link.query.ts';
  import { type SharedLinkResponseDto } from '@immich/sdk';
  import { IconButton, modalManager, toastManager } from '@immich/ui';
  import { mdiDeleteOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    sharedLink: SharedLinkResponseDto;
  }

  let { sharedLink = $bindable() }: Props = $props();

  const onAction = async () => {
    const assetIds = assetMultiSelectManager.assets.map(({ id }) => id);
    const success = await modalManager.showDialog({
      title: $t('remove_assets_title'),
      prompt: $t('remove_assets_shared_link_confirmation', { values: { count: assetIds.length } }),
      confirmText: $t('remove'),
    });
    if (!success) {
      return;
    }

    await executeMutation(removeSharedLinkAssetsMutation, [{ id: sharedLink.id, assetIdsDto: { assetIds } }], {
      onSuccess: (results) => {
        const removed = new Set(results.filter(({ success }) => success).map(({ assetId }) => assetId));
        sharedLink.assets = sharedLink.assets.filter(({ id }) => !removed.has(id));
        toastManager.primary($t('assets_removed_count', { values: { count: removed.size } }));
        assetMultiSelectManager.clear();
      },
    });
  };
</script>

<svelte:document use:shortcut={{ shortcut: { key: 'Delete' }, onShortcut: onAction }} />

<IconButton
  shape="round"
  color="secondary"
  variant="ghost"
  aria-label={$t('remove_from_shared_link')}
  onclick={onAction}
  icon={mdiDeleteOutline}
/>
