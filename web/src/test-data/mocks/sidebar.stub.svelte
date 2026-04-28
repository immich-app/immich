<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    ariaLabel?: string;
    children?: Snippet;
  }

  let { ariaLabel, children }: Props = $props();
</script>

<nav aria-label={ariaLabel}>
  {@render children?.()}
</nav>
