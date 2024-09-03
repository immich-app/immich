<script lang="ts">
  import NumberRangeInput from '$lib/components/shared-components/number-range-input.svelte';
  import { generateId } from '$lib/utils/generate-id';
  import { t } from 'svelte-i18n';

  export let lat: number | null | undefined = undefined;
  export let lng: number | null | undefined = undefined;
  export let onUpdate: (lat: number, lng: number) => void;

  const id = generateId();

  const onInput = () => {
    if (lat != null && lng != null) {
      onUpdate(lat, lng);
    }
  };

  const onPaste = (event: ClipboardEvent) => {
    const coords = event.clipboardData?.getData('text/plain')?.split(',');
    if (!coords || coords.length !== 2) {
      return;
    }

    const [latitude, longitude] = coords.map((coord) => Number.parseFloat(coord));
    if (Number.isNaN(latitude) || latitude < -90 || latitude > 90) {
      return;
    }
    if (Number.isNaN(longitude) || longitude < -180 || longitude > 180) {
      return;
    }

    event.preventDefault();
    [lat, lng] = [latitude, longitude];
  };
</script>

<div>
  <label class="immich-form-label" for="latitude-input-{id}">{$t('latitude')}</label>
  <NumberRangeInput id="latitude-input-{id}" min={-90} max={90} {onInput} {onPaste} bind:value={lat} />
</div>

<div>
  <label class="immich-form-label" for="longitude-input-{id}">{$t('longitude')}</label>
  <NumberRangeInput id="longitude-input-{id}" min={-180} max={180} {onInput} {onPaste} bind:value={lng} />
</div>
