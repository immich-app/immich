<script lang="ts">
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import { api } from '@api';
  import { getAssetControlContext } from '../asset-select-control-bar.svelte';
  import {
    NotificationType,
    notificationController,
  } from '$lib/components/shared-components/notification/notification';
  import { handleError } from '$lib/utils/handle-error';
  import type { OnStack } from '$lib/utils/actions';

  export let onStack: OnStack | undefined;

  const { clearSelect, getOwnedAssets } = getAssetControlContext();

  const handleStack = async () => {
    try {
      const assets = [...getOwnedAssets()];
      const parent = assets.at(0);

      if (parent == undefined) {
        return;
      }

      const children = assets.slice(1);
      const ids = children.map(({ id }) => id);

      if (children.length > 0) {
        await api.assetApi.updateAssets({ assetBulkUpdateDto: { ids, stackParentId: parent.id } });
      }

      let childrenCount = parent.stackCount ?? 0;
      for (const asset of children) {
        asset.stackParentId = parent?.id;
        // Add grand-children's count to new parent
        childrenCount += asset.stackCount == undefined ? 1 : asset.stackCount + 1;
        // Reset children stack info
        asset.stackCount = null;
        asset.stack = [];
      }

      parent.stackCount = childrenCount;
      onStack?.(ids);

      notificationController.show({
        message: `Stacked ${ids.length + 1} assets`,
        type: NotificationType.Info,
        timeout: 1500,
      });

      clearSelect();
    } catch (error) {
      handleError(error, `Unable to stack`);
    }
  };
</script>

<MenuOption text="Stack" on:click={handleStack} />
