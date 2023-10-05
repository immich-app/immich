<script lang="ts">
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import ConfirmDialogue from '$lib/components/shared-components/confirm-dialogue.svelte';
  import {
    NotificationType,
    notificationController,
  } from '$lib/components/shared-components/notification/notification';
  import { handleError } from '$lib/utils/handle-error';
  import { api } from '@api';
  import DeleteOutline from 'svelte-material-icons/DeleteOutline.svelte';
  import TimerSand from 'svelte-material-icons/TimerSand.svelte';
  import MenuOption from '../../shared-components/context-menu/menu-option.svelte';
  import { OnAssetDelete, getAssetControlContext } from '../asset-select-control-bar.svelte';
  import { createEventDispatcher } from 'svelte';

  export let onAssetDelete: OnAssetDelete;
  export let menuItem = false;
  const { getAssets, clearSelect } = getAssetControlContext();

  const dispatch = createEventDispatcher();

  let isShowConfirmation = false;
  let loading = false;

  const handleDelete = async () => {
    loading = true;

    try {
      let count = 0;

      const { data: deletedAssets } = await api.assetApi.deleteAsset({
        deleteAssetDto: {
          ids: Array.from(getAssets()).map((a) => a.id),
        },
      });

      for (const asset of deletedAssets) {
        if (asset.status === 'SUCCESS') {
          onAssetDelete(asset.id);
          count++;
        }
      }

      notificationController.show({
        message: `Deleted ${count}`,
        type: NotificationType.Info,
      });

      clearSelect();
    } catch (e) {
      handleError(e, 'Error deleting assets');
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
  <MenuOption text="Delete" on:click={() => (isShowConfirmation = true)} />
{/if}

{#if !menuItem}
  {#if loading}
    <CircleIconButton title="Loading" logo={TimerSand} />
  {:else}
    <CircleIconButton title="Delete" logo={DeleteOutline} on:click={() => (isShowConfirmation = true)} />
  {/if}
{/if}

{#if isShowConfirmation}
  <ConfirmDialogue
    title="Delete Asset{getAssets().size > 1 ? 's' : ''}"
    confirmText="Delete"
    on:confirm={handleDelete}
    on:cancel={() => (isShowConfirmation = false)}
    on:escape={escape}
  >
    <svelte:fragment slot="prompt">
      <p>
        Are you sure you want to delete
        {#if getAssets().size > 1}
          these <b>{getAssets().size}</b> assets? This will also remove them from their album(s).
        {:else}
          this asset? This will also remove it from its album(s).
        {/if}
      </p>
      <p><b>You cannot undo this action!</b></p>
    </svelte:fragment>
  </ConfirmDialogue>
{/if}
