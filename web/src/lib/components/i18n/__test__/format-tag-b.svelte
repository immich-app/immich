<script lang="ts">
  import FormatMessage from '../format-message.svelte';
  import type { ComponentProps } from 'svelte';

  export let key: string;
  export let values: ComponentProps<FormatMessage>['values'];
</script>

<FormatMessage {key} {values} let:tag let:message>
  {#if tag === 'b'}
    <strong>{message}</strong>
  {/if}
</FormatMessage>
