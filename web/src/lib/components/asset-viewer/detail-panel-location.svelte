<script lang="ts">
  import ChangeLocation from '$lib/components/shared-components/change-location.svelte';
  import Portal from '$lib/elements/Portal.svelte';
  import { handleError } from '$lib/utils/handle-error';
  import { updateAsset, type AssetResponseDto } from '@immich/sdk';
  import { Icon } from '@immich/ui';
  import { mdiMapMarkerOutline, mdiPencil } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    isOwner: boolean;
    asset: AssetResponseDto;
  }

  let { isOwner, asset = $bindable() }: Props = $props();

  let isShowChangeLocation = $state(false);

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
</script>

{#if asset.exifInfo?.country}
  <button
    type="button"
    class="flex w-full text-start justify-between place-items-start gap-4 py-4"
    onclick={() => (isOwner ? (isShowChangeLocation = true) : null)}
    title={isOwner ? $t('edit_location') : ''}
    class:hover:text-primary={isOwner}
  >
    <div class="flex gap-4">
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
    </div>

    {#if isOwner}
      <div>
        <Icon icon={mdiPencil} size="20" />
      </div>
    {/if}
  </button>
{:else if !asset.exifInfo?.city && isOwner}
  <button
    type="button"
    class="flex w-full text-start justify-between place-items-start gap-4 py-4 rounded-lg hover:text-primary"
    onclick={() => (isShowChangeLocation = true)}
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
