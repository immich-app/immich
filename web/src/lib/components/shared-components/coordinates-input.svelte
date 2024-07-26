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
</script>

<div>
  <label class="immich-form-label" for="latitude-input-{id}">{$t('latitude')}</label>
  <NumberRangeInput id="latitude-input-{id}" min={-90} max={90} {onInput} bind:value={lat} />
</div>

<div>
  <label class="immich-form-label" for="longitude-input-{id}">{$t('longitude')}</label>
  <NumberRangeInput id="longitude-input-{id}" min={-180} max={180} {onInput} bind:value={lng} />
</div>
