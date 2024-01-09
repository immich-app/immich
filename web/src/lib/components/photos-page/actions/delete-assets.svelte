<script lang="ts">
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import ConfirmDialogue from '$lib/components/shared-components/confirm-dialogue.svelte';
  import {
    NotificationType,
    notificationController,
  } from '$lib/components/shared-components/notification/notification';
  import { handleError } from '$lib/utils/handle-error';
  import { api } from '@api';
  import MenuOption from '../../shared-components/context-menu/menu-option.svelte';
  import { OnAssetDelete, getAssetControlContext } from '../asset-select-control-bar.svelte';
  import { createEventDispatcher } from 'svelte';
  import { featureFlags } from '$lib/stores/server-config.store';
  import { mdiTimerSand, mdiDeleteOutline } from '@mdi/js';

  export let onAssetDelete: OnAssetDelete;
  export let menuItem = false;
  export let force = !$featureFlags.trash;

  const { clearSelect, getOwnedAssets } = getAssetControlContext();

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

    try {
      const ids = Array.from(getOwnedAssets())
        .filter((a) => !a.isExternal)
        .map((a) => a.id);
      await api.assetApi.deleteAssets({ assetBulkDeleteDto: { ids, force } });
      for (const id of ids) {
        onAssetDelete(id);
      }

      notificationController.show({
        message: `${force ? 'Définitivement supprimé' : 'Supprimer'} ${ids.length} ressources`,
        type: NotificationType.Info,
      });

      clearSelect();
    } catch (e) {
      handleError(e, 'Erreur de suppressions des ressources');
    } finally {
      isShowConfirmation = false;
      loading = false;
    }
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
  <ConfirmDialogue
    title="Supprimer définitevement la ressource{getOwnedAssets().size > 1 ? 's' : ''}"
    confirmText="Supprimer"
    on:confirm={handleDelete}
    on:cancel={() => (isShowConfirmation = false)}
    on:escape={escape}
  >
    <svelte:fragment slot="prompt">
      <p>
        Êtes-vous sûr de vouloir supprimer définitivement
        {#if getOwnedAssets().size > 1}
          ces <b>{getOwnedAssets().size}</b> ressources ? Cela les retirera également de leur(s) album(s).
        {:else}
          cette ressource ? Cela la retirera également de son(ses) album(s).
        {/if}
      </p>
      <p><b>Vous ne pouvez pas annuler cette action !</b></p>
    </svelte:fragment>
  </ConfirmDialogue>
{/if}
