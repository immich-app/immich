<script lang="ts">
  import DeleteAssetDialog from '$lib/components/photos-page/delete-asset-dialog.svelte';
  import { getAssetControlContext } from '$lib/components/timeline/AssetSelectControlBar.svelte';
  import { featureFlags } from '$lib/stores/server-config.store';
  import { type OnDelete, type OnUndoDelete, deleteAssets } from '$lib/utils/actions';
  import { IconButton } from '@immich/ui';
  import { mdiDeleteForeverOutline, mdiDeleteOutline, mdiTimerSand } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import MenuOption from '../../shared-components/context-menu/menu-option.svelte';

  interface Props {
    onAssetDelete: OnDelete;
    onUndoDelete?: OnUndoDelete | undefined;
    menuItem?: boolean;
    force?: boolean;
  }

  let { onAssetDelete, onUndoDelete = undefined, menuItem = false, force = !$featureFlags.trash }: Props = $props();

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
    const assets = [...getOwnedAssets()];
    await deleteAssets(force, onAssetDelete, assets, onUndoDelete);
    clearSelect();
    isShowConfirmation = false;
    loading = false;
  };
</script>

{#if menuItem}
  <MenuOption text={label} icon={mdiDeleteOutline} onClick={handleTrash} />
{:else if loading}
  <IconButton
    shape="round"
    color="secondary"
    variant="ghost"
    aria-label={$t('loading')}
    icon={mdiTimerSand}
    onclick={() => {}}
  />
{:else}
  <IconButton
    shape="round"
    color="secondary"
    variant="ghost"
    aria-label={label}
    icon={mdiDeleteForeverOutline}
    onclick={handleTrash}
  />
{/if}

{#if isShowConfirmation}
  <DeleteAssetDialog
    size={getOwnedAssets().length}
    onConfirm={handleDelete}
    onCancel={() => (isShowConfirmation = false)}
  />
{/if}
