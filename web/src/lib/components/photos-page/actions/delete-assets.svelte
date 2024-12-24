<script lang="ts">
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import MenuOption from '../../shared-components/context-menu/menu-option.svelte';
  import { getAssetControlContext } from '../asset-select-control-bar.svelte';
  import { featureFlags } from '$lib/stores/server-config.store';
  import { mdiTimerSand, mdiDeleteOutline, mdiDeleteForeverOutline } from '@mdi/js';
  import { type OnDelete, deleteAssets } from '$lib/utils/actions';
  import DeleteAssetDialog from '../delete-asset-dialog.svelte';
  import { t } from 'svelte-i18n';
  import { deleteStacks, getStack } from '@immich/sdk';

  import { handleError } from '$lib/utils/handle-error';

  interface Props {
    onAssetDelete: OnDelete;
    menuItem?: boolean;
    force?: boolean;
  }

  let { onAssetDelete, menuItem = false, force = !$featureFlags.trash }: Props = $props();

  const { clearSelect, getOwnedAssets } = getAssetControlContext();

  let isShowConfirmation = $state(false);
  let loading = $state(false);

  let label = $derived(force ? $t('permanently_delete') : $t('delete'));

  const handleTrash = async () => {
    if (force) {
      isShowConfirmation = true;
      return;
    }

    await handleDelete();
  };

  const handleDelete = async () => {
    loading = true;
    const ownedAssets = [...getOwnedAssets()];

    try {
      const stackIds: string[] = [];
      const pendingAssetIds: Array<Promise<string[]>> = [];
      const assetIds: string[] = [];
      for (const asset of ownedAssets) {
        let stackId = asset.stack?.id;

        if (stackId) {
          stackIds.push(stackId);

          const assetIds = getStack({ id: stackId }).then((stack) => stack.assets.map((asset) => asset.id));
          pendingAssetIds.push(assetIds);
        } else {
          assetIds.push(asset.id);
        }
      }

      let fetchedAssetIds = await Promise.all(pendingAssetIds);
      const ids = assetIds.concat(...fetchedAssetIds.flat());

      if (stackIds.length > 0) {
        await deleteStacks({ bulkIdsDto: { ids: stackIds } });
      }
      await deleteAssets(force, onAssetDelete, ids);
    } catch (error) {
      handleError(error, $t('errors.unable_to_delete_assets'));
    }

    clearSelect();
    isShowConfirmation = false;
    loading = false;
  };
</script>

{#if menuItem}
  <MenuOption text={label} icon={mdiDeleteOutline} onClick={handleTrash} />
{:else if loading}
  <CircleIconButton title={$t('loading')} icon={mdiTimerSand} onclick={() => {}} />
{:else}
  <CircleIconButton title={label} icon={mdiDeleteForeverOutline} onclick={handleTrash} />
{/if}

{#if isShowConfirmation}
  <DeleteAssetDialog
    size={getOwnedAssets().size}
    onConfirm={handleDelete}
    onCancel={() => (isShowConfirmation = false)}
  />
{/if}
