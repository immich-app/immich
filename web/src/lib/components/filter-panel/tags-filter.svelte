<script lang="ts">
  import type { TagOption } from './filter-panel';

  interface Props {
    tags: TagOption[];
    selectedIds: string[];
    onSelectionChange: (ids: string[]) => void;
  }

  let { tags, selectedIds, onSelectionChange }: Props = $props();

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
  {#if tags.length === 0}
    <p class="text-sm text-gray-400 dark:text-gray-500" data-testid="tags-empty">No tags available</p>
  {:else}
    {#each tags as tag (tag.id)}
      {@const isActive = selectedIds.includes(tag.id)}
      <button
        type="button"
        class="-mx-2 flex w-[calc(100%+1rem)] items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-subtle {isActive
          ? 'font-medium'
          : 'text-gray-500 dark:text-gray-300'}"
        onclick={() => toggleTag(tag.id)}
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
  {/if}
</div>
