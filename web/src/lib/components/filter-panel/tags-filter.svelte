<script lang="ts">
  import { Icon } from '@immich/ui';
  import { mdiMagnify } from '@mdi/js';
  import { SvelteMap } from 'svelte/reactivity';
  import type { TagOption } from './filter-panel';

  interface Props {
    tags: TagOption[];
    selectedIds: string[];
    selectedNames?: Map<string, string>;
    onSelectionChange: (ids: string[]) => void;
  }

  let { tags, selectedIds, selectedNames, onSelectionChange }: Props = $props();

  let searchQuery = $state('');
  let showAll = $state(false);

  const INITIAL_SHOW_COUNT = 10;

  // Cache tag names so orphaned tags can display their name even after removal from results
  const tagNameCache = new SvelteMap<string, string>();
  $effect(() => {
    for (const tag of tags) {
      tagNameCache.set(tag.id, tag.name);
    }
  });

  // Clear search when tags list changes (e.g. temporal filter refetch)
  let previousTagsLength = 0;
  $effect(() => {
    const currentLength = tags.length;
    if (previousTagsLength > 0 && currentLength !== previousTagsLength) {
      searchQuery = '';
      showAll = false;
    }
    previousTagsLength = currentLength;
  });

  // Orphaned tags: selected but not in current results
  let orphanedTags = $derived(
    selectedIds
      .filter((id) => !tags.some((t) => t.id === id))
      .map((id) => ({ id, name: selectedNames?.get(id) ?? tagNameCache.get(id) ?? id })),
  );

  let filteredTags = $derived(
    searchQuery.trim() ? tags.filter((t) => t.name.toLowerCase().includes(searchQuery.trim().toLowerCase())) : tags,
  );

  // When searching, show all results (no truncation); otherwise respect INITIAL_SHOW_COUNT
  let visibleTags = $derived(searchQuery.trim() || showAll ? filteredTags : filteredTags.slice(0, INITIAL_SHOW_COUNT));

  let remainingCount = $derived(Math.max(0, filteredTags.length - INITIAL_SHOW_COUNT));

  function toggleTag(id: string) {
    const isSelected = selectedIds.includes(id);
    if (isSelected) {
      onSelectionChange(selectedIds.filter((tid) => tid !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  }
</script>

<div data-testid="tags-filter">
  {#if tags.length === 0 && orphanedTags.length === 0}
    <p class="text-sm text-gray-400 dark:text-gray-500" data-testid="tags-empty">No tags available</p>
  {:else}
    <!-- Search input -->
    <div class="relative mb-2">
      <div class="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
        <Icon icon={mdiMagnify} size="14" />
      </div>
      <input
        type="text"
        class="immich-form-input h-8 w-full rounded-lg pl-7 pr-2 text-sm"
        placeholder="Search tags..."
        bind:value={searchQuery}
        oninput={() => {
          showAll = false;
        }}
        data-testid="tags-search-input"
      />
    </div>

    <!-- Orphaned tags (selected but no longer in suggestions) -->
    {#each orphanedTags as tag (tag.id)}
      <button
        type="button"
        class="-mx-2 flex w-[calc(100%+1rem)] items-center gap-2 rounded-lg px-2 py-1.5 text-sm opacity-50 hover:bg-subtle"
        onclick={() => toggleTag(tag.id)}
        aria-pressed="true"
        data-testid="tags-item-{tag.id}"
      >
        <!-- Checkbox (always checked for orphaned) -->
        <div
          class="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded bg-immich-primary dark:bg-immich-dark-primary"
        >
          <svg viewBox="0 0 24 24" class="h-3 w-3 text-white dark:text-black">
            <path fill="currentColor" d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z" />
          </svg>
        </div>

        <!-- Label -->
        <span class="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-left font-medium">{tag.name}</span>
      </button>
    {/each}

    <!-- Empty search results -->
    {#if filteredTags.length === 0 && searchQuery.trim()}
      <p class="text-sm text-gray-400 dark:text-gray-500" data-testid="tags-no-results">No matching tags</p>
    {/if}

    <!-- Tags list -->
    {#each visibleTags as tag (tag.id)}
      {@const isActive = selectedIds.includes(tag.id)}
      <button
        type="button"
        class="-mx-2 flex w-[calc(100%+1rem)] items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-subtle {isActive
          ? 'font-medium'
          : 'text-gray-500 dark:text-gray-300'}"
        onclick={() => toggleTag(tag.id)}
        aria-pressed={isActive}
        data-testid="tags-item-{tag.id}"
      >
        <!-- Checkbox -->
        <div
          class="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded {isActive
            ? 'bg-immich-primary dark:bg-immich-dark-primary'
            : 'border border-gray-300 dark:border-gray-600'}"
        >
          {#if isActive}
            <svg viewBox="0 0 24 24" class="h-3 w-3 text-white dark:text-black">
              <path fill="currentColor" d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z" />
            </svg>
          {/if}
        </div>

        <!-- Label -->
        <span class="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-left">{tag.name}</span>
      </button>
    {/each}

    <!-- Show more link -->
    {#if !showAll && remainingCount > 0 && !searchQuery.trim()}
      <button
        type="button"
        class="py-1 text-xs font-medium text-immich-primary dark:text-immich-dark-primary"
        onclick={() => (showAll = true)}
        data-testid="tags-show-more"
      >
        Show {remainingCount} more
      </button>
    {/if}
  {/if}
</div>
