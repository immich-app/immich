<script lang="ts">
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import MenuOption from '../../shared-components/context-menu/menu-option.svelte';
  import { getAssetControlContext } from '../asset-select-control-bar.svelte';
  import { featureFlags } from '$lib/stores/server-config.store';
  import { mdiTimerSand, mdiDeleteOutline, mdiDeleteForeverOutline } from '@mdi/js';
  import { type OnDelete, deleteAssets } from '$lib/utils/actions';
  import DeleteAssetDialog from '../delete-asset-dialog.svelte';
  import { t } from 'svelte-i18n';

  export let onAssetDelete: OnDelete;
  export let menuItem = false;
  export let force = !$featureFlags.trash;

  const { clearSelect, getOwnedAssets } = getAssetControlContext();

  let isShowConfirmation = false;
  let loading = false;

  $: label = force ? $t('permanently_delete') : $t('delete');

  const handleTrash = async () => {
    if (force) {
      isShowConfirmation = true;
      return;
    }

    await handleDelete();
  };

  const handleDelete = async () => {
    loading = true;
    const ids = [...getOwnedAssets()].map((a) => a.id);
    await deleteAssets(force, onAssetDelete, ids);
    clearSelect();
    isShowConfirmation = false;
    loading = false;
  };
</script>

{#if menuItem}
  <MenuOption text={label} icon={mdiDeleteOutline} onClick={handleTrash} />
{:else if loading}
  <CircleIconButton title={$t('loading')} icon={mdiTimerSand} />
{:else}
  <CircleIconButton title={label} icon={mdiDeleteForeverOutline} on:click={handleTrash} />
{/if}

{#if isShowConfirmation}
  <DeleteAssetDialog
    size={getOwnedAssets().size}
    onConfirm={handleDelete}
    onCancel={() => (isShowConfirmation = false)}
  />
{/if}
