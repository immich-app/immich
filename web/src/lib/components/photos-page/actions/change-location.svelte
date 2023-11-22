<script lang="ts">
  import { api } from '@api';
  import {
    notificationController,
    NotificationType,
  } from '$lib/components/shared-components/notification/notification';
  import MenuOption from '../../shared-components/context-menu/menu-option.svelte';
  import { getAssetControlContext } from '../asset-select-control-bar.svelte';
  import { featureFlags } from '$lib/stores/server-config.store';
  import ChangeLocation from '$lib/components/shared-components/change-location.svelte';

  export let force = !$featureFlags.trash;
  export let menuItem = false;
  const { clearSelect, getOwnedAssets } = getAssetControlContext();

  let isShowChangeLocation = false;

  async function handleConfirmChangeLocation(event: CustomEvent<{ lng: number; lat: number }>) {
    isShowChangeLocation = false;
    const ids = Array.from(getOwnedAssets())
      .filter((a) => !a.isExternal)
      .map((a) => a.id);

    try {
      await api.assetApi.updateAssets({
        assetBulkUpdateDto: {
          ids: ids,
          latitude: event.detail.lat,
          longitude: event.detail.lng,
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
  <MenuOption text={force ? 'Change location' : 'Change location'} on:click={() => (isShowChangeLocation = true)} />
{/if}
{#if isShowChangeLocation}
  <ChangeLocation
    confirmText="Confirm"
    on:confirm={handleConfirmChangeLocation}
    on:cancel={() => (isShowChangeLocation = false)}
  >
    <svelte:fragment slot="prompt">
      <p>Please select a new location:</p>
    </svelte:fragment>
  </ChangeLocation>
{/if}
