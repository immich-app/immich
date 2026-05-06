<script lang="ts">
  import type { Snippet } from 'svelte';

  type Props = {
    children?: Snippet;
    description?: string;
    label: string;
  };

  let { children, description, label }: Props = $props();
</script>

<section>
  <h2>{label}</h2>
  {#if description}
    <p>{description}</p>
  {/if}
  {#if children}
    {@render children()}
  {/if}
</section>
