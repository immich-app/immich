<script lang="ts">
  import { clamp } from 'lodash-es';
  import type { ClipboardEventHandler } from 'svelte/elements';

  export let id: string;
  export let min: number;
  export let max: number;
  export let step: number | string = 'any';
  export let required = true;
  export let value: number | null = null;
  export let onInput: (value: number | null) => void;
  export let onPaste: ClipboardEventHandler<HTMLInputElement> | undefined = undefined;
</script>

<input
  type="number"
  class="immich-form-input w-full"
  {id}
  {min}
  {max}
  {step}
  {required}
  bind:value
  on:input={() => {
    if (value !== null && (value < min || value > max)) {
      value = clamp(value, min, max);
    }
    onInput(value);
  }}
  on:paste={onPaste}
/>
