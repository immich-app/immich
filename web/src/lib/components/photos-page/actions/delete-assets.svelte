<script lang="ts">
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import MenuOption from '../../shared-components/context-menu/menu-option.svelte';
  import { getAssetControlContext } from '../asset-select-control-bar.svelte';
  import { createEventDispatcher } from 'svelte';
  import { featureFlags } from '$lib/stores/server-config.store';
  import { mdiTimerSand, mdiDeleteOutline } from '@mdi/js';
  import { type OnDelete, deleteAssets } from '$lib/utils/actions';
  import DeleteAssetDialog from '../delete-asset-dialog.svelte';

  export let onAssetDelete: OnDelete;
  export let menuItem = false;
  export let force = !$featureFlags.trash;

  const { getOwnedAssets } = getAssetControlContext();

  const dispatch = createEventDispatcher<{
    escape: void;
  }>();

  let isShowConfirmation = false;
  let loading = false;

  const handleTrash = async () => {
    if (force) {
      isShowConfirmation = true;
      return;
    }

    await handleDelete();
  };

  const handleDelete = async () => {
    loading = true;
    const ids = [...getOwnedAssets()].filter((a) => !a.isExternal).map((a) => a.id);
    await deleteAssets(force, onAssetDelete, ids);
    clearSelect();
    isShowConfirmation = false;
    loading = false;
  };

  const escape = () => {
    dispatch('escape');
    isShowConfirmation = false;
  };
</script>

{#if menuItem}
  <MenuOption text={force ? 'Définitivement supprimé' : 'Supprimer'} on:click={handleTrash} />
{:else if loading}
  <CircleIconButton title="Chargement" icon={mdiTimerSand} />
{:else}
  <CircleIconButton title="Supprimer" icon={mdiDeleteOutline} on:click={handleTrash} />
{/if}

{#if isShowConfirmation}
  <DeleteAssetDialog
    size={getOwnedAssets().size}
    on:confirm={handleDelete}
    on:cancel={() => (isShowConfirmation = false)}
    on:escape={escape}
  />
{/if}
