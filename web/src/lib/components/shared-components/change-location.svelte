<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import FullScreenModal from './full-screen-modal.svelte';
  import Button from '../elements/buttons/button.svelte';
  import type { Color } from '$lib/components/elements/buttons/button.svelte';
  import Map from './map/map.svelte';
  export const title = 'Change Location';
  export let prompt = 'Please select a new date:';
  export let confirmText = 'Confirm';
  export let confirmColor: Color = 'primary';
  export let cancelText = 'Cancel';
  export let cancelColor: Color = 'secondary';
  export let hideCancelButton = false;
  export let location: { lng: number; lat: number } = { lng: 0, lat: 0 };
  export let id_asset: string | null = null;
  const dispatch = createEventDispatcher();

  let isConfirmButtonDisabled = false;

  const originalLat = location.lat;
  const originalLng = location.lng;

  const handleCancel = () => dispatch('cancel');
  const handleEscape = () => {
    if (!isConfirmButtonDisabled) {
      dispatch('cancel');
    }
  };

  const handleConfirm = () => {
    dispatch('confirm', location);
  };
</script>

<FullScreenModal on:clickOutside={handleCancel} on:escape={() => handleEscape()}>
  <div
    class="w-[500px] max-w-[95vw] rounded-3xl border bg-immich-bg p-4 py-8 shadow-sm dark:border-immich-dark-gray dark:bg-immich-dark-gray dark:text-immich-dark-fg"
  >
    <div
      class="flex flex-col place-content-center place-items-center gap-4 px-4 text-immich-primary dark:text-immich-dark-primary"
    />
    <div>
      <div class="text-md px-4 py-5 text-center">
        <slot name="prompt">
          <p>{prompt}</p>
        </slot>
        <div class="mt-2" />
        <div class="flex flex-col">
          <label for="datetime">Pick a location</label>
        </div>
        <div style="height: 500px;">
          <Map
            mapMarkers={id_asset
              ? [
                  {
                    id: id_asset,
                    lat: originalLat,
                    lon: originalLng,
                  },
                ]
              : []}
            zoom={id_asset ? 15 : 1}
            center={location}
            simplified={true}
            clickable={true}
            on:clickedPoint={(e) => {
              location = e.detail;
            }}
          />
        </div>
      </div>

      <div class="mt-4 flex w-full gap-4 px-4">
        {#if !hideCancelButton}
          <Button color={cancelColor} fullwidth on:click={handleCancel}>
            {cancelText}
          </Button>
        {/if}
        <Button color={confirmColor} fullwidth on:click={handleConfirm} disabled={isConfirmButtonDisabled}>
          {confirmText}
        </Button>
      </div>
    </div>
  </div>
</FullScreenModal>
