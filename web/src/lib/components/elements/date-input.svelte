<script lang="ts">
  import type { HTMLInputAttributes } from 'svelte/elements';

  interface $$Props extends HTMLInputAttributes {
    type: 'date' | 'datetime-local';
  }

  export let type: $$Props['type'];
  export let value: $$Props['value'] = undefined;
  export let max: $$Props['max'] = undefined;

  $: fallbackMax = type === 'date' ? '9999-12-31' : '9999-12-31T23:59';

  // Updating `value` directly causes the date input to reset itself or
  // interfere with user changes.
  $: updatedValue = value;
</script>

<input
  {...$$restProps}
  {type}
  {value}
  max={max || fallbackMax}
  on:input={(e) => (updatedValue = e.currentTarget.value)}
  on:blur={() => (value = updatedValue)}
  on:keydown={(e) => {
    if (e.key === 'Enter') {
      value = updatedValue;
    }
  }}
/>
