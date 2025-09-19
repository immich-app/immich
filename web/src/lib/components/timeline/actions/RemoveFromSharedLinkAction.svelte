<script lang="ts">
  import { getAssetControlContext } from '$lib/components/timeline/AssetSelectControlBar.svelte';
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import { handleError } from '$lib/utils/handle-error';
  import { removeSharedLinkAssets, type SharedLinkResponseDto } from '@immich/sdk';
  import { IconButton, modalManager } from '@immich/ui';
  import { mdiDeleteOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import { NotificationType, notificationController } from '../../shared-components/notification/notification';

  interface Props {
    sharedLink: SharedLinkResponseDto;
  }

  let { sharedLink = $bindable() }: Props = $props();

  const { getAssets, clearSelect } = getAssetControlContext();

  const handleRemove = async () => {
    const isConfirmed = await modalManager.showDialog({
      title: $t('remove_assets_title'),
      prompt: $t('remove_assets_shared_link_confirmation', { values: { count: getAssets().length } }),
      confirmText: $t('remove'),
    });

    if (!isConfirmed) {
      return;
    }

    try {
      const results = await removeSharedLinkAssets({
        ...authManager.params,
        id: sharedLink.id,
        assetIdsDto: {
          assetIds: [...getAssets()].map((asset) => asset.id),
        },
      });

      for (const result of results) {
        if (!result.success) {
          continue;
        }

        sharedLink.assets = sharedLink.assets.filter((asset) => asset.id !== result.assetId);
      }

      const count = results.filter((item) => item.success).length;

      notificationController.show({
        type: NotificationType.Info,
        message: $t('assets_removed_count', { values: { count } }),
      });

      clearSelect();
    } catch (error) {
      handleError(error, $t('errors.unable_to_remove_assets_from_shared_link'));
    }
  };
</script>

<IconButton
  shape="round"
  color="secondary"
  variant="ghost"
  aria-label={$t('remove_from_shared_link')}
  onclick={handleRemove}
  icon={mdiDeleteOutline}
/>
