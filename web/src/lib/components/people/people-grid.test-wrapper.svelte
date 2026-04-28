<script lang="ts">
  import PeopleGrid from './people-grid.svelte';

  type Item = {
    id: string;
    label: string;
  };

  interface Props {
    items: Item[];
    hasNextPage?: boolean;
    loading?: boolean;
    loadNextPage: () => void;
  }

  let { items, hasNextPage = false, loading = false, loadNextPage }: Props = $props();
</script>

<PeopleGrid {items} {hasNextPage} {loading} {loadNextPage}>
  {#snippet children(item)}
    <span>{item.label}</span>
  {/snippet}
</PeopleGrid>
