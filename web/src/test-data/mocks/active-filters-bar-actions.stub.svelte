<script lang="ts">
  type Props = {
    searchQuery?: string;
    onClearSearch?: () => void;
    onClearAll?: () => void;
    onRemoveFilter?: (type: string, id?: string) => void;
  };

  let { searchQuery = '', onClearSearch, onClearAll, onRemoveFilter }: Props = $props();
</script>

<div data-testid="active-filters-bar-stub">
  <button type="button" data-testid="active-filters-clear-search" onclick={() => onClearSearch?.()}>Clear search</button
  >
  <button
    type="button"
    data-testid="active-filters-clear-all"
    onclick={() => {
      onClearAll?.();
      if (searchQuery) {
        onClearSearch?.();
      }
    }}
  >
    Clear all
  </button>
  <button
    type="button"
    data-testid="active-filters-remove-person"
    onclick={() => onRemoveFilter?.('person', 'person-1')}
  >
    Remove person
  </button>
</div>
