<script lang="ts">
  import Icon from '$lib/components/elements/icon.svelte';
  import ChangeLocation from '$lib/components/shared-components/change-location.svelte';
  import Portal from '$lib/components/shared-components/portal/portal.svelte';
  import { handleError } from '$lib/utils/handle-error';
  import { updateAsset, type AssetResponseDto } from '@immich/sdk';
  import { mdiMapMarkerOutline, mdiPencil } from '@mdi/js';
  import { t } from 'svelte-i18n';

  export let isOwner: boolean;
  export let asset: AssetResponseDto;

  let isShowChangeLocation = false;

  async function handleConfirmChangeLocation(gps: { lng: number; lat: number }) {
    isShowChangeLocation = false;

    try {
      asset = await updateAsset({
        id: asset.id,
        updateAssetDto: { latitude: gps.lat, longitude: gps.lng },
      });
    } catch (error) {
      handleError(error, $t('errors.unable_to_change_location'));
    }
  }
</script>

{#if asset.exifInfo?.country}
  <button
    type="button"
    class="flex w-full text-left justify-between place-items-start gap-4 py-4"
    on:click={() => (isOwner ? (isShowChangeLocation = true) : null)}
    title={isOwner ? $t('edit_location') : ''}
    class:hover:dark:text-immich-dark-primary={isOwner}
    class:hover:text-immich-primary={isOwner}
  >
    <div class="flex gap-4">
      <div><Icon path={mdiMapMarkerOutline} size="24" /></div>

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
    </div>

    {#if isOwner}
      <div>
        <Icon path={mdiPencil} size="20" />
      </div>
    {/if}
  </button>
{:else if !asset.exifInfo?.city && isOwner}
  <button
    type="button"
    class="flex w-full text-left justify-between place-items-start gap-4 py-4 rounded-lg hover:dark:text-immich-dark-primary hover:text-immich-primary"
    on:click={() => (isShowChangeLocation = true)}
    title={$t('add_location')}
  >
    <div class="flex gap-4">
      <div><Icon path={mdiMapMarkerOutline} size="24" /></div>

      <p>{$t('add_a_location')}</p>
    </div>
    <div class="focus:outline-none p-1">
      <Icon path={mdiPencil} size="20" />
    </div>
  </button>
{/if}

{#if isShowChangeLocation}
  <Portal>
    <ChangeLocation {asset} onConfirm={handleConfirmChangeLocation} onCancel={() => (isShowChangeLocation = false)} />
  </Portal>
{/if}
