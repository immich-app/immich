<script lang="ts">
  import ChangeLocation from '$lib/components/shared-components/change-location.svelte';
  import Portal from '$lib/elements/Portal.svelte';
  import { handleError } from '$lib/utils/handle-error';
  import { updateAsset, type AssetResponseDto } from '@immich/sdk';
  import { ConfirmModal, Icon } from '@immich/ui';
  import { mdiMapMarkerOff, mdiMapMarkerOutline, mdiPencil } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    isOwner: boolean;
    asset: AssetResponseDto;
  }

  let { isOwner, asset = $bindable() }: Props = $props();

  let isShowChangeLocation = $state(false);
  let isConfirmClearLocation = $state(false);

  const onClose = async (point?: { lng: number; lat: number }) => {
    isShowChangeLocation = false;

    if (!point) {
      return;
    }

    try {
      asset = await updateAsset({
        id: asset.id,
        updateAssetDto: { latitude: point.lat, longitude: point.lng },
      });
    } catch (error) {
      handleError(error, $t('errors.unable_to_change_location'));
    }
  };

  async function handleConfirmModalClose(confirmed: boolean) {
    isConfirmClearLocation = false;
    if (confirmed) {
      try {
        asset = await updateAsset({ id: asset.id, updateAssetDto: { latitude: null, longitude: null } });
      } catch (error) {
        handleError(error, $t('errors.unable_to_change_location'));
      }
    }
  }

  function openChangeLocation(e?: Event) {
    e?.stopPropagation();
    isShowChangeLocation = true;
  }

  function confirmClearLocation(e?: Event) {
    e?.stopPropagation();
    isConfirmClearLocation = true;
  }
</script>

{#if asset.exifInfo?.country}
  <div class="flex w-full text-start justify-between place-items-start gap-4 py-4">
    <button
      type="button"
      class="flex gap-4 flex-1"
      onclick={() => (isOwner ? (isShowChangeLocation = true) : null)}
      title={isOwner ? $t('edit_location') : ''}
      class:hover:dark:text-immich-dark-primary={isOwner}
      class:hover:text-immich-primary={isOwner}
    >
      <div><Icon icon={mdiMapMarkerOutline} size="24" /></div>

      <div>
        {#if asset.exifInfo?.city}
          <p>{asset.exifInfo.city}</p>
        {/if}
        {#if asset.exifInfo?.state}
          <div class="flex gap-2 text-sm">
            <p>{asset.exifInfo.state}</p>
          </div>
        {/if}
        {#if asset.exifInfo?.country}
          <div class="flex gap-2 text-sm">
            <p>{asset.exifInfo.country}</p>
          </div>
        {/if}
      </div>
    </button>

    {#if isOwner}
      <div class="flex items-center gap-2">
        <button type="button" class="p-1" onclick={openChangeLocation} title={$t('edit_location')}>
          <Icon icon={mdiPencil} size="20" />
        </button>
        {#if asset.hasUserLocation}
          <button type="button" class="p-1 text-red-600" onclick={confirmClearLocation} title={$t('clear_location')}>
            <Icon icon={mdiMapMarkerOff} size="20" />
          </button>
        {/if}
      </div>
    {/if}
  </div>
{:else if !asset.exifInfo?.city && isOwner}
  <button
    type="button"
    class="flex w-full text-start justify-between place-items-start gap-4 py-4 rounded-lg hover:dark:text-immich-dark-primary hover:text-immich-primary"
    onclick={openChangeLocation}
    title={$t('add_location')}
  >
    <div class="flex gap-4">
      <div><Icon icon={mdiMapMarkerOutline} size="24" /></div>

      <p>{$t('add_a_location')}</p>
    </div>
    <div class="focus:outline-none p-1">
      <Icon icon={mdiPencil} size="20" />
    </div>
  </button>
{/if}

{#if isShowChangeLocation}
  <Portal>
    <ChangeLocation {asset} {onClose} />
  </Portal>
{/if}

{#if isConfirmClearLocation}
  <ConfirmModal
    confirmColor="danger"
    title={$t('clear_location')}
    prompt={$t('confirm_clear_location_prompt', { values: { count: 1 } })}
    icon={mdiMapMarkerOff}
    size="small"
    onClose={handleConfirmModalClose}
  />
{/if}
