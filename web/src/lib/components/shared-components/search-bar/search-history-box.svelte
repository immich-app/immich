<script lang="ts">
  import Icon from '$lib/components/elements/icon.svelte';
  import { searchStore } from '$lib/stores/search.svelte';
  import { mdiMagnify, mdiClose } from '@mdi/js';
  import { fly } from 'svelte/transition';
  import { t } from 'svelte-i18n';
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';

  interface Props {
    id: string;
    searchQuery?: string;
    isSearchSuggestions?: boolean;
    isOpen?: boolean;
    onSelectSearchTerm: (searchTerm: string) => void;
    onClearSearchTerm: (searchTerm: string) => void;
    onClearAllSearchTerms: () => void;
    onActiveSelectionChange: (selectedId: string | undefined) => void;
  }

  let {
    id,
    searchQuery = '',
    isSearchSuggestions = $bindable(false),
    isOpen = false,
    onSelectSearchTerm,
    onClearSearchTerm,
    onClearAllSearchTerms,
    onActiveSelectionChange,
  }: Props = $props();

  let filteredSearchTerms = $derived(
    searchStore.savedSearchTerms.filter((term) => term.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  $effect(() => {
    isSearchSuggestions = filteredSearchTerms.length > 0;
  });

  let showClearAll = $derived(searchQuery === '');
  let suggestionCount = $derived(showClearAll ? filteredSearchTerms.length + 1 : filteredSearchTerms.length);

  let selectedIndex: number | undefined = $state(undefined);
  let element = $state<HTMLDivElement>();

  export function moveSelection(increment: 1 | -1) {
    if (!isSearchSuggestions) {
      return;
    } else if (selectedIndex === undefined) {
      selectedIndex = increment === 1 ? 0 : suggestionCount - 1;
    } else if (selectedIndex + increment < 0 || selectedIndex + increment >= suggestionCount) {
      clearSelection();
    } else {
      selectedIndex = (selectedIndex + increment + suggestionCount) % suggestionCount;
    }
    onActiveSelectionChange(getId(selectedIndex));
  }

  export function clearSelection() {
    selectedIndex = undefined;
    onActiveSelectionChange(undefined);
  }

  export function selectActiveOption() {
    if (selectedIndex === undefined) {
      return;
    }
    const selectedElement = element?.querySelector(`#${getId(selectedIndex)}`) as HTMLElement;
    selectedElement?.click();
  }

  const handleClearAll = () => {
    clearSelection();
    onClearAllSearchTerms();
  };

  const handleClearSingle = (searchTerm: string) => {
    clearSelection();
    onClearSearchTerm(searchTerm);
  };

  const handleSelect = (searchTerm: string) => {
    clearSelection();
    onSelectSearchTerm(searchTerm);
  };

  const getId = (index: number | undefined) => {
    if (index === undefined) {
      return undefined;
    }
    return `${id}-${index}`;
  };
</script>

<div role="listbox" {id} aria-label={$t('recent_searches')} bind:this={element}>
  {#if isOpen && isSearchSuggestions}
    <div
      transition:fly={{ y: 25, duration: 150 }}
      class="absolute w-full rounded-b-3xl border-2 border-t-0 border-gray-200 bg-white pb-5 shadow-2xl transition-all dark:border-gray-700 dark:bg-immich-dark-gray dark:text-gray-300"
    >
      <div class="flex items-center justify-between px-5 pt-5 text-xs">
        <p class="py-2" aria-hidden={true}>{$t('recent_searches').toUpperCase()}</p>
        {#if showClearAll}
          <button
            id={getId(0)}
            type="button"
            class="rounded-lg p-2 font-semibold text-immich-primary aria-selected:bg-immich-primary/25 hover:bg-immich-primary/25 dark:text-immich-dark-primary"
            role="option"
            onclick={() => handleClearAll()}
            tabindex="-1"
            aria-selected={selectedIndex === 0}
            aria-label={$t('clear_all_recent_searches')}
          >
            {$t('clear_all')}
          </button>
        {/if}
      </div>

      {#each filteredSearchTerms as savedSearchTerm, i (i)}
        {@const index = showClearAll ? i + 1 : i}
        <div class="flex w-full items-center justify-between text-sm text-black dark:text-gray-300">
          <div class="relative w-full items-center">
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <div
              id={getId(index)}
              class="relative flex w-full cursor-pointer gap-3 py-3 ps-5 hover:bg-gray-100 aria-selected:bg-gray-100 dark:aria-selected:bg-gray-500/30 dark:hover:bg-gray-500/30"
              onclick={() => handleSelect(savedSearchTerm)}
              role="option"
              tabindex="-1"
              aria-selected={selectedIndex === index}
              aria-label={savedSearchTerm}
            >
              <Icon path={mdiMagnify} size="1.5em" ariaHidden={true} />
              {savedSearchTerm}
            </div>
            <div aria-hidden={true} class="absolute end-5 top-0 items-center justify-center py-3">
              <CircleIconButton
                icon={mdiClose}
                title={$t('remove')}
                size="18"
                padding="1"
                tabindex={-1}
                onclick={() => handleClearSingle(savedSearchTerm)}
              />
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
