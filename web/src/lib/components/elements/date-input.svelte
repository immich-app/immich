<script lang="ts">
  import { run } from 'svelte/legacy';

  import type { HTMLInputAttributes } from 'svelte/elements';

  

  interface Props {
    type: 'date' | 'datetime-local';
    value?: $$Props['value'];
    max?: $$Props['max'];
    [key: string]: any
  }

  let { type, value = $bindable(undefined), max = undefined, ...rest }: Props = $props();

  let fallbackMax = $derived(type === 'date' ? '9999-12-31' : '9999-12-31T23:59');

  // Updating `value` directly causes the date input to reset itself or
  // interfere with user changes.
  let updatedValue;
  run(() => {
    updatedValue = value;
  });
</script>

<input
  {...rest}
  {type}
  {value}
  max={max || fallbackMax}
  oninput={(e) => (updatedValue = e.currentTarget.value)}
  onblur={() => (value = updatedValue)}
  onkeydown={(e) => {
    if (e.key === 'Enter') {
      value = updatedValue;
    }
  }}
/>
