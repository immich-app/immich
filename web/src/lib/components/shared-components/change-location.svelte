<script lang="ts">
  import type { AssetResponseDto } from '@api';
  import { createEventDispatcher } from 'svelte';
  import ConfirmDialogue from './confirm-dialogue.svelte';
  import Map from './map/map.svelte';
  export const title = 'Change Location';
  export let asset: AssetResponseDto | undefined = undefined;

  interface Point {
    lng: number;
    lat: number;
  }

  const dispatch = createEventDispatcher<{
    cancel: void;
    confirm: Point;
  }>();

  $: lat = asset?.exifInfo?.latitude || 0;
  $: lng = asset?.exifInfo?.longitude || 0;
  $: zoom = lat && lng ? 15 : 1;

  let point: Point | null = null;

  const handleCancel = () => dispatch('cancel');

  const handleSelect = (selected: Point) => {
    point = selected;
  };

  const handleConfirm = () => {
    if (point) {
      dispatch('confirm', point);
    } else {
      dispatch('cancel');
    }
  };
</script>

<ConfirmDialogue
  confirmColor="primary"
  cancelColor="secondary"
  title="Change Location"
  width={800}
  on:confirm={handleConfirm}
  on:cancel={handleCancel}
>
  <div slot="prompt" class="flex flex-col w-full h-full gap-2">
    <label for="datetime">Pick a location</label>
    <div class="h-[500px] min-h-[300px] w-full">
      <Map
        mapMarkers={lat && lng && asset ? [{ id: asset.id, lat, lon: lng }] : []}
        {zoom}
        center={lat && lng ? { lat, lng } : undefined}
        simplified={true}
        clickable={true}
        on:clickedPoint={({ detail: point }) => handleSelect(point)}
      />
    </div>
  </div>
</ConfirmDialogue>
