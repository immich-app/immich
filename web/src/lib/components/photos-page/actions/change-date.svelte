<script lang="ts">
  import { api } from '@api';
  import {
    notificationController,
    NotificationType,
  } from '$lib/components/shared-components/notification/notification';
  import MenuOption from '../../shared-components/context-menu/menu-option.svelte';
  import { getAssetControlContext } from '../asset-select-control-bar.svelte';
  import { featureFlags } from '$lib/stores/server-config.store';
  import ChangeDate from '$lib/components/shared-components/change-date.svelte';
  import { DateTime } from 'luxon';
  export let force = !$featureFlags.trash;
  export let menuItem = false;
  const { clearSelect, getOwnedAssets } = getAssetControlContext();

  let isShowChangeDate = false;

  async function handleConfirmChangeDate(event: CustomEvent<string>) {
    isShowChangeDate = false;
    const ids = Array.from(getOwnedAssets())
      .filter((a) => !a.isExternal)
      .map((a) => a.id);

    try {
      await api.assetApi.updateAssets({
        assetBulkUpdateDto: {
          ids: ids,
          dateTimeOriginal: event.detail,
        },
      });
      notificationController.show({ message: 'Metadata updated please reload to apply', type: NotificationType.Info });
    } catch (error) {
      console.error(error);
    }
    clearSelect();
  }
</script>

{#if menuItem}
  <MenuOption text={force ? 'Change date' : 'Change date'} on:click={() => (isShowChangeDate = true)} />
{/if}
{#if isShowChangeDate}
  <ChangeDate
    title="Change Date"
    confirmText="Confirm"
    initialDate={DateTime.now()}
    on:confirm={handleConfirmChangeDate}
    on:cancel={() => (isShowChangeDate = false)}
  >
    <svelte:fragment slot="prompt">
      <p>Please select a new date:</p>
    </svelte:fragment>
  </ChangeDate>
{/if}
