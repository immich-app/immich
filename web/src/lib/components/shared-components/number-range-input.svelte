<script lang="ts">
  import { clamp } from 'lodash-es';
  import type { ClipboardEventHandler } from 'svelte/elements';

  interface Props {
    id: string;
    min: number;
    max: number;
    step?: number | string;
    required?: boolean;
    value?: number;
    onInput: (value: number | null) => void;
    onPaste?: ClipboardEventHandler<HTMLInputElement>;
  }

  let {
    id,
    min,
    max,
    step = 'any',
    required = true,
    value = $bindable(),
    onInput,
    onPaste = undefined,
  }: Props = $props();

  const oninput = () => {
    if (!value) {
      return;
    }

    if (value !== null && (value < min || value > max)) {
      value = clamp(value, min, max);
    }
    onInput(value);
  };
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
  {oninput}
  onpaste={onPaste}
/>
