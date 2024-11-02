<script lang="ts">
  import { clamp } from 'lodash-es';
  import type { ClipboardEventHandler } from 'svelte/elements';

  interface Props {
    id: string;
    min: number;
    max: number;
    step?: number | string;
    required?: boolean;
    value?: number | null;
    onInput: (value: number | null) => void;
    onPaste?: ClipboardEventHandler<HTMLInputElement> | undefined;
  }

  let {
    id,
    min,
    max,
    step = 'any',
    required = true,
    value = $bindable(null),
    onInput,
    onPaste = undefined
  }: Props = $props();
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
  oninput={() => {
    if (value !== null && (value < min || value > max)) {
      value = clamp(value, min, max);
    }
    onInput(value);
  }}
  onpaste={onPaste}
/>
