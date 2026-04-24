<script lang="ts">
  interface Props {
    sortOrder?: string;
  }

  let { sortOrder = '' }: Props = $props();
</script>

<div data-testid="search-sort-dropdown" data-sort-order={sortOrder}></div>
