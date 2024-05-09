<script lang="ts">
  import type { HTMLInputAttributes } from 'svelte/elements';

  interface $$Props extends HTMLInputAttributes {
    type: 'date' | 'datetime-local';
  }

  export let value: $$Props['value'] = undefined;

  // Updating `value` directly causes the date input to reset itself or
  // interfere with user changes.
  $: updatedValue = value;
</script>

<input
  {...$$restProps}
  {value}
  on:input={(e) => (updatedValue = e.currentTarget.value)}
  on:blur={() => (value = updatedValue)}
/>
