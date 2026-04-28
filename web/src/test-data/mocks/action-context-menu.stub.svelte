<script lang="ts">
  type ActionItem = {
    title: string;
    onAction?: () => void;
  };

  interface Props {
    items?: ActionItem[];
    [key: string]: unknown;
  }

  let { items = [], ...rest }: Props = $props();
  const ariaLabel = $derived(String(rest['aria-label'] ?? 'menu'));
</script>

{#if items.length > 0}
  <div>
    <button type="button" aria-label={ariaLabel}>menu</button>
    {#each items as item (item.title)}
      <button type="button" onclick={() => item.onAction?.()}>{item.title}</button>
    {/each}
  </div>
{/if}
