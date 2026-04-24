<script lang="ts">
  import { Icon } from '@immich/ui';
  import { mdiChevronDown, mdiMagnify, mdiSortCalendarAscending, mdiSortCalendarDescending } from '@mdi/js';

  type SortMode = 'relevance' | 'asc' | 'desc';

  interface Props {
    sortOrder: SortMode;
    onSelect: (mode: SortMode) => void;
    compact?: boolean;
    showRelevance?: boolean;
  }

  let { sortOrder, onSelect, compact = false, showRelevance = true }: Props = $props();
  let open = $state(false);

  const allOptions: { value: SortMode; label: string; icon: string }[] = [
    { value: 'relevance', label: 'Relevance', icon: mdiMagnify },
    { value: 'desc', label: 'Newest first', icon: mdiSortCalendarDescending },
    { value: 'asc', label: 'Oldest first', icon: mdiSortCalendarAscending },
  ];

  let options = $derived(showRelevance ? allOptions : allOptions.filter((option) => option.value !== 'relevance'));
  let currentOption = $derived(options.find((o) => o.value === sortOrder) ?? options[0]);

  function handleSelect(event: MouseEvent, value: SortMode) {
    event.stopPropagation();
    open = false;
    onSelect(value);
  }

  function handleClickOutside(event: MouseEvent) {
    if (!(event.target as HTMLElement).closest('[data-testid="search-sort-container"]')) {
      open = false;
    }
  }
</script>

<svelte:window onclick={handleClickOutside} />

<div class="relative" data-testid="search-sort-container">
  <button
    type="button"
    aria-label={currentOption.label}
    class={`flex items-center rounded-full py-1.5 text-sm text-gray-500 hover:bg-subtle dark:text-gray-400 ${
      compact ? 'h-10 w-10 justify-center px-0' : 'gap-1 px-3'
    }`}
    data-testid="search-sort-btn"
    onclick={() => (open = !open)}
  >
    <Icon icon={currentOption.icon} size="16" />
    {#if !compact}
      <span>{currentOption.label}</span>
      <Icon icon={mdiChevronDown} size="14" />
    {/if}
  </button>

  {#if open}
    <div
      class="absolute right-0 top-full z-10 mt-1 min-w-[160px] rounded-lg border border-gray-200 bg-light py-1 shadow-lg dark:border-gray-700"
    >
      {#each options as option (option.value)}
        <button
          type="button"
          class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-subtle"
          class:font-semibold={option.value === sortOrder}
          onclick={(e) => handleSelect(e, option.value)}
        >
          <Icon icon={option.icon} size="16" />
          <span>{option.label}</span>
        </button>
      {/each}
    </div>
  {/if}
</div>
