<script lang="ts">
  import FormatTags from '../format-tags.svelte';
  import type { ComponentProps } from 'svelte';

  export let message: unknown;
  export let values: ComponentProps<FormatTags>['values'];
</script>

<FormatTags {message} {values} let:tag let:message>
  {#if tag === 'b'}
    <strong>{message}</strong>
  {/if}
</FormatTags>
