<script lang="ts">
  import type { Snippet } from 'svelte';

  type Props = {
    children?: Snippet;
    disabled?: boolean;
    loading?: boolean;
    onclick?: () => void | Promise<void>;
  };

  let { children, disabled = false, loading = false, onclick }: Props = $props();
</script>

<button type="button" {disabled} aria-busy={loading} {onclick}>
  {#if children}
    {@render children()}
  {/if}
</button>
