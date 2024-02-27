<script lang="ts">
  import type { HTMLInputAttributes } from 'svelte/elements';

  interface $$Props extends HTMLInputAttributes {
    type: 'date' | 'datetime-local';
  }

  export let value: $$Props['value'] = undefined;
  $: updatedValue = value;
</script>

<input
  {...$$restProps}
  {value}
  on:input={(e) => {
    updatedValue = e.currentTarget.value;

    // Only update when value is not empty to prevent resetting the input
    if (updatedValue !== '') {
      value = updatedValue;
    }
  }}
  on:blur={() => (value = updatedValue)}
/>
