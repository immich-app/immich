<script lang="ts">
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import { getKey } from '$lib/utils';
  import { handleError } from '$lib/utils/handle-error';
  import { removeSharedLinkAssets, type SharedLinkResponseDto } from '@immich/sdk';
  import { mdiDeleteOutline } from '@mdi/js';
  import { NotificationType, notificationController } from '../../shared-components/notification/notification';
  import { getAssetControlContext } from '../asset-select-control-bar.svelte';
  import { dialogController } from '$lib/components/shared-components/dialog/dialog';
  import { t } from 'svelte-i18n';

  export let sharedLink: SharedLinkResponseDto;

  const { getAssets, clearSelect } = getAssetControlContext();

  const handleRemove = async () => {
    const isConfirmed = await dialogController.show({
      title: $t('remove_assets_title'),
      prompt: $t('remove_assets_shared_link_confirmation', { values: { count: getAssets().size } }),
      confirmText: $t('remove'),
    });

    if (!isConfirmed) {
      return;
    }

    try {
      const results = await removeSharedLinkAssets({
        id: sharedLink.id,
        assetIdsDto: {
          assetIds: [...getAssets()].map((asset) => asset.id),
        },
        key: getKey(),
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

<CircleIconButton title={$t('remove_from_shared_link')} on:click={handleRemove} icon={mdiDeleteOutline} />
