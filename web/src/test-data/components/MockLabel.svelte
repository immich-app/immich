<script lang="ts">
  import type { Snippet } from 'svelte';

  type Props = {
    children?: Snippet;
    [key: string]: unknown;
  };

  let { children, ...rest }: Props = $props();
</script>

<label {...rest}>
  {#if children}
    {@render children()}
  {/if}
</label>
