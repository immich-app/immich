<script lang="ts">
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import { api } from '@api';
  import { OnStack, getAssetControlContext } from '../asset-select-control-bar.svelte';
  import {
    NotificationType,
    notificationController,
  } from '$lib/components/shared-components/notification/notification';
  import { handleError } from '$lib/utils/handle-error';

  export let onStack: OnStack | undefined = undefined;

  const { getAssets, clearSelect } = getAssetControlContext();

  const handleStack = async () => {
    try {
      const assets = Array.from(getAssets());
      const parent = assets.at(0);

      if (parent == undefined) {
        return;
      }

      const children = assets.slice(1);
      const ids = children.map(({ id }) => id);

      if (children.length > 0) {
        await api.assetApi.updateAssets({ assetBulkUpdateDto: { ids, stackParentId: parent.id } });
      }

      for (const asset of children) {
        asset.stackParentId = parent?.id;
      }

      // Not the perfect count, but doesn't matter for the web client as long as it is > 0
      parent.stackCount = children.length;

      onStack?.(ids);

      notificationController.show({
        message: `Stacked ${ids.length + 1} assets`,
        type: NotificationType.Info,
      });

      clearSelect();
    } catch (error) {
      handleError(error, `Unable to stack`);
    }
  };
</script>

<MenuOption text="Stack" on:click={handleStack} />
