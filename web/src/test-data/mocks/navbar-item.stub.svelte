<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    title: string;
    href?: string;
    expanded?: boolean;
    items?: Snippet;
  }

  let { title, href = '#', expanded = $bindable(false), items }: Props = $props();
</script>

<a {href} data-expanded={expanded}>{title}</a>

{#if items}
  {@render items()}
{/if}
