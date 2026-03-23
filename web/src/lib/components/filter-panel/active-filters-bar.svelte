<script lang="ts">
  import type { FilterState } from './filter-panel';

  interface Props {
    filters: FilterState;
    resultCount?: number;
    personNames?: Map<string, string>;
    tagNames?: Map<string, string>;
    onRemoveFilter: (type: string, id?: string) => void;
    onClearAll: () => void;
  }

  let { filters, resultCount, personNames, tagNames, onRemoveFilter, onClearAll }: Props = $props();

  interface Chip {
    type: string;
    id?: string;
    label: string;
  }

  let chips = $derived.by(() => {
    const result: Chip[] = [];

    // Person chips (one per selected person)
    for (const personId of filters.personIds) {
      const name = personNames?.get(personId) ?? personId;
      result.push({ type: 'person', id: personId, label: name });
    }

    // Location chip
    if (filters.city && filters.country) {
      result.push({ type: 'location', label: `${filters.city}, ${filters.country}` });
    } else if (filters.country) {
      result.push({ type: 'location', label: filters.country });
    }

    // Camera chip
    if (filters.make && filters.model) {
      result.push({ type: 'camera', label: `${filters.make} ${filters.model}` });
    } else if (filters.make) {
      result.push({ type: 'camera', label: filters.make });
    }

    // Tag chips (one per selected tag)
    for (const tagId of filters.tagIds) {
      const name = tagNames?.get(tagId) ?? tagId;
      result.push({ type: 'tag', id: tagId, label: name });
    }

    // Rating chip
    if (filters.rating !== undefined) {
      result.push({ type: 'rating', label: `\u2605 ${filters.rating}+` });
    }

    // Media type chip
    if (filters.mediaType === 'image') {
      result.push({ type: 'mediaType', label: 'Photos only' });
    } else if (filters.mediaType === 'video') {
      result.push({ type: 'mediaType', label: 'Videos only' });
    }

    return result;
  });

  let hasActiveFilters = $derived(chips.length > 0);
</script>

<div
  class="flex flex-wrap items-center gap-1.5 border-b border-gray-200 bg-gray-50 px-4 py-2 dark:border-gray-700 dark:bg-gray-900"
  data-testid="active-filters-bar"
>
  {#if resultCount !== undefined}
    <span class="text-xs text-gray-400 dark:text-gray-500" data-testid="result-count">
      {resultCount.toLocaleString()} result{resultCount === 1 ? '' : 's'}
    </span>
  {/if}

  {#each chips as chip (`${chip.type}-${chip.id ?? chip.label}`)}
    <span
      class="inline-flex items-center gap-1 rounded-full bg-gray-200 px-2.5 py-0.5 text-xs dark:bg-gray-700"
      data-testid="active-chip"
    >
      <span>{chip.label}</span>
      <button
        type="button"
        class="flex h-4 w-4 items-center justify-center rounded-full text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
        onclick={() => onRemoveFilter(chip.type, chip.id)}
        aria-label="Remove {chip.label} filter"
        data-testid="chip-close"
      >
        &times;
      </button>
    </span>
  {/each}

  {#if hasActiveFilters}
    <button
      type="button"
      class="ml-auto text-xs font-semibold text-immich-primary dark:text-immich-dark-primary"
      onclick={onClearAll}
      data-testid="clear-all-btn"
    >
      Clear all
    </button>
  {/if}
</div>
