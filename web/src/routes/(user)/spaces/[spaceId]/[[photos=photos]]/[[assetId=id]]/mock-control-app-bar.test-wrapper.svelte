<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    leading?: Snippet;
    trailing?: Snippet;
    children?: Snippet;
  }

  let { leading, trailing, children }: Props = $props();
</script>

<div data-testid="control-app-bar">
  {@render leading?.()}
  {@render children?.()}
  {@render trailing?.()}
</div>
