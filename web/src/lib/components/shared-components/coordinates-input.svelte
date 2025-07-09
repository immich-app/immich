<script lang="ts">
  import NumberRangeInput from '$lib/components/shared-components/number-range-input.svelte';
  import { parseCoordinateString } from '$lib/utils/coordinates-utils';
  import { generateId } from '$lib/utils/generate-id';
  import { t } from 'svelte-i18n';

  interface Props {
    lat?: number;
    lng?: number;
    onUpdate: (lat: number, lng: number) => void;
  }

  let { lat = $bindable(), lng = $bindable(), onUpdate }: Props = $props();

  const id = generateId();

  const onInput = () => {
    if (lat != null && lng != null) {
      onUpdate(lat, lng);
    }
  };

  const onPaste = (event: ClipboardEvent) => {
    const pastedText = event.clipboardData?.getData('text/plain');
    if (!pastedText) {
      return;
    }

    const parsed = parseCoordinateString(pastedText);
    if (parsed) {
      event.preventDefault();
      lat = parsed.latitude;
      lng = parsed.longitude;
      onInput();
    }
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
