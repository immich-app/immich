<script lang="ts">
  import { goto } from '$app/navigation';
  import { focusOutside } from '$lib/actions/focus-outside';
  import { shortcuts } from '$lib/actions/shortcut';
  import { AppRoute } from '$lib/constants';
  import SearchFilterModal from '$lib/modals/SearchFilterModal.svelte';
  import { searchStore } from '$lib/stores/search.svelte';
  import { handlePromiseError } from '$lib/utils';
  import { generateId } from '$lib/utils/generate-id';
  import { getMetadataSearchQuery } from '$lib/utils/metadata-search';
  import type { MetadataSearchDto, SmartSearchDto } from '@immich/sdk';
  import { Button, IconButton, modalManager } from '@immich/ui';
  import { mdiClose, mdiMagnify, mdiTune } from '@mdi/js';
  import { onDestroy, onMount, tick } from 'svelte';
  import { t } from 'svelte-i18n';
  import SearchHistoryBox from './search-history-box.svelte';

  interface Props {
    value?: string;
    grayTheme: boolean;
    searchQuery?: MetadataSearchDto | SmartSearchDto;
  }

  let { value = $bindable(''), grayTheme, searchQuery = {} }: Props = $props();

  let showClearIcon = $derived(value.length > 0);

  let input = $state<HTMLInputElement>();
  let searchHistoryBox = $state<ReturnType<typeof SearchHistoryBox>>();
  let showSuggestions = $state(false);
  let isSearchSuggestions = $state(false);
  let selectedId: string | undefined = $state();
  let close: (() => Promise<void>) | undefined;
  let showSearchTypeDropdown = $state(false);
  let currentSearchType = $state('smart');

  const listboxId = generateId();
  const searchTypeId = generateId();

  onDestroy(() => {
    searchStore.isSearchEnabled = false;
  });

  const handleSearch = async (payload: SmartSearchDto | MetadataSearchDto) => {
    const params = getMetadataSearchQuery(payload);

    closeDropdown();
    searchStore.isSearchEnabled = false;
    await goto(`${AppRoute.SEARCH}?${params}`);
  };

  const clearSearchTerm = (searchTerm: string) => {
    input?.focus();
    searchStore.savedSearchTerms = searchStore.savedSearchTerms.filter((item) => item !== searchTerm);
  };

  const saveSearchTerm = (saveValue: string) => {
    const filteredSearchTerms = searchStore.savedSearchTerms.filter(
      (item) => item.toLowerCase() !== saveValue.toLowerCase(),
    );
    searchStore.savedSearchTerms = [saveValue, ...filteredSearchTerms];

    if (searchStore.savedSearchTerms.length > 5) {
      searchStore.savedSearchTerms = searchStore.savedSearchTerms.slice(0, 5);
    }
  };

  const clearAllSearchTerms = () => {
    input?.focus();
    searchStore.savedSearchTerms = [];
  };

  const onFocusIn = () => {
    searchStore.isSearchEnabled = true;
    getSearchType();
  };

  const onFocusOut = () => {
    searchStore.isSearchEnabled = false;
  };

  const buildSearchPayload = (term: string): SmartSearchDto | MetadataSearchDto => {
    const searchType = getSearchType();
    switch (searchType) {
      case 'smart': {
        return { query: term };
      }
      case 'metadata': {
        return { originalFileName: term };
      }
      case 'description': {
        return { description: term };
      }
      case 'ocr': {
        return { ocr: term };
      }
      default: {
        return { query: term };
      }
    }
  };

  const onHistoryTermClick = async (searchTerm: string) => {
    value = searchTerm;
    await handleSearch(buildSearchPayload(searchTerm));
  };

  const onFilterClick = async () => {
    value = '';

    if (close) {
      await close();
      close = undefined;
      return;
    }

    const result = modalManager.open(SearchFilterModal, { searchQuery });
    close = () => result.close();
    closeDropdown();

    const searchResult = await result.onClose;
    close = undefined;

    // Refresh search type after modal closes
    getSearchType();

    if (!searchResult) {
      return;
    }

    await handleSearch(searchResult);
  };

  const onSubmit = () => {
    handlePromiseError(handleSearch(buildSearchPayload(value)));
    saveSearchTerm(value);
  };

  const onClear = () => {
    value = '';
    input?.focus();
  };

  const onEscape = () => {
    closeDropdown();
    closeSearchTypeDropdown();
  };

  const onArrow = async (direction: 1 | -1) => {
    openDropdown();
    await tick();
    searchHistoryBox?.moveSelection(direction);
  };

  const onEnter = (event: KeyboardEvent) => {
    if (selectedId) {
      event.preventDefault();
      searchHistoryBox?.selectActiveOption();
    }
  };

  const onInput = () => {
    openDropdown();
    searchHistoryBox?.clearSelection();
  };

  const openDropdown = () => {
    showSuggestions = true;
  };

  const closeDropdown = () => {
    showSuggestions = false;
    searchHistoryBox?.clearSelection();
  };

  const toggleSearchTypeDropdown = () => {
    showSearchTypeDropdown = !showSearchTypeDropdown;
  };

  const closeSearchTypeDropdown = () => {
    showSearchTypeDropdown = false;
  };

  const selectSearchType = (type: string) => {
    localStorage.setItem('searchQueryType', type);
    currentSearchType = type;
    showSearchTypeDropdown = false;
  };

  const onsubmit = (event: Event) => {
    event.preventDefault();
    onSubmit();
  };

  function getSearchType() {
    const searchType = localStorage.getItem('searchQueryType');
    switch (searchType) {
      case 'smart':
      case 'metadata':
      case 'description':
      case 'ocr': {
        currentSearchType = searchType;
        return searchType;
      }
      default: {
        currentSearchType = 'smart';
        return 'smart';
      }
    }
  }

  function getSearchTypeText(): string {
    switch (currentSearchType) {
      case 'smart': {
        return $t('context');
      }
      case 'metadata': {
        return $t('filename');
      }
      case 'description': {
        return $t('description');
      }
      case 'ocr': {
        return $t('ocr');
      }
      default: {
        return $t('context');
      }
    }
  }

  onMount(() => {
    getSearchType();
  });

  const searchTypes = [
    { value: 'smart', label: () => $t('context') },
    { value: 'metadata', label: () => $t('filename') },
    { value: 'description', label: () => $t('description') },
    { value: 'ocr', label: () => $t('ocr') },
  ] as const;
</script>

<svelte:document
  use:shortcuts={[
    { shortcut: { key: 'Escape' }, onShortcut: onEscape },
    { shortcut: { ctrl: true, key: 'k' }, onShortcut: () => input?.select() },
    { shortcut: { ctrl: true, shift: true, key: 'k' }, onShortcut: onFilterClick },
  ]}
/>

<div class="w-full relative z-auto" use:focusOutside={{ onFocusOut }} tabindex="-1">
  <form
    draggable="false"
    autocomplete="off"
    class="select-text text-sm"
    action={AppRoute.SEARCH}
    onreset={() => (value = '')}
    {onsubmit}
    onfocusin={onFocusIn}
    role="search"
  >
    <div use:focusOutside={{ onFocusOut: closeDropdown }} tabindex="-1">
      <label for="main-search-bar" class="sr-only">{$t('search_your_photos')}</label>
      <input
        type="text"
        name="q"
        id="main-search-bar"
        class="w-full transition-all border-2 ps-14 py-4 max-md:py-2 text-immich-fg/75 dark:text-immich-dark-fg
        {showClearIcon ? 'pe-22.5' : 'pe-14'}
        {grayTheme ? 'dark:bg-immich-dark-gray' : 'dark:bg-immich-dark-bg'}
        {showSuggestions && isSearchSuggestions ? 'rounded-t-3xl' : 'rounded-3xl bg-gray-200'}
        {searchStore.isSearchEnabled ? 'border-gray-200 dark:border-gray-700 bg-white' : 'border-transparent'}"
        placeholder={$t('search_your_photos')}
        required
        pattern="^(?!m:$).*$"
        bind:value
        bind:this={input}
        onfocus={openDropdown}
        oninput={onInput}
        role="combobox"
        aria-controls={listboxId}
        aria-activedescendant={selectedId ?? ''}
        aria-expanded={showSuggestions && isSearchSuggestions}
        aria-autocomplete="list"
        aria-describedby={searchTypeId}
        use:shortcuts={[
          { shortcut: { key: 'Escape' }, onShortcut: onEscape },
          { shortcut: { ctrl: true, shift: true, key: 'k' }, onShortcut: onFilterClick },
          { shortcut: { key: 'ArrowUp' }, onShortcut: () => onArrow(-1) },
          { shortcut: { key: 'ArrowDown' }, onShortcut: () => onArrow(1) },
          { shortcut: { key: 'Enter' }, onShortcut: onEnter, preventDefault: false },
          { shortcut: { key: 'ArrowDown', alt: true }, onShortcut: openDropdown },
        ]}
      />

      <!-- SEARCH HISTORY BOX -->
      <SearchHistoryBox
        bind:this={searchHistoryBox}
        bind:isSearchSuggestions
        id={listboxId}
        searchQuery={value}
        isOpen={showSuggestions}
        onClearAllSearchTerms={clearAllSearchTerms}
        onClearSearchTerm={(searchTerm) => clearSearchTerm(searchTerm)}
        onSelectSearchTerm={(searchTerm) => handlePromiseError(onHistoryTermClick(searchTerm))}
        onActiveSelectionChange={(id) => (selectedId = id)}
      />
    </div>

    <div class="absolute inset-y-0 {showClearIcon ? 'end-14' : 'end-2'} flex items-center ps-6 transition-all">
      <IconButton
        aria-label={$t('show_search_options')}
        shape="round"
        icon={mdiTune}
        onclick={onFilterClick}
        size="medium"
        color="secondary"
        variant="ghost"
      />
    </div>

    {#if searchStore.isSearchEnabled}
      <div
        id={searchTypeId}
        class="absolute inset-y-0 flex items-center end-16"
        class:max-md:hidden={value}
        class:end-28={value.length > 0}
      >
        <div class="relative">
          <Button
            class="bg-immich-primary text-white dark:bg-immich-dark-primary/90 dark:text-black/75 rounded-full px-3 py-1 text-xs hover:opacity-80 transition-opacity cursor-pointer"
            onclick={toggleSearchTypeDropdown}
            aria-expanded={showSearchTypeDropdown}
            aria-haspopup="listbox"
          >
            {getSearchTypeText()}
          </Button>

          {#if showSearchTypeDropdown}
            <div
              class="absolute top-full right-0 mt-1 bg-white dark:bg-immich-dark-gray border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg py-1 min-w-32 z-9999"
              use:focusOutside={{ onFocusOut: closeSearchTypeDropdown }}
            >
              {#each searchTypes as searchType (searchType.value)}
                <button
                  type="button"
                  class="w-full text-left px-3 py-2 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors
                         {currentSearchType === searchType.value ? 'bg-gray-100 dark:bg-gray-700' : ''}"
                  onclick={() => selectSearchType(searchType.value)}
                >
                  {searchType.label()}
                </button>
              {/each}
            </div>
          {/if}
        </div>
      </div>
    {/if}

    {#if showClearIcon}
      <div class="absolute inset-y-0 end-0 flex items-center pe-2">
        <IconButton
          onclick={onClear}
          icon={mdiClose}
          aria-label={$t('clear')}
          size="medium"
          color="secondary"
          variant="ghost"
          shape="round"
        />
      </div>
    {/if}
    <div class="absolute inset-y-0 start-0 flex items-center ps-2">
      <IconButton
        type="submit"
        aria-label={$t('search')}
        icon={mdiMagnify}
        size="medium"
        onclick={() => {}}
        shape="round"
        color="secondary"
        variant="ghost"
      />
    </div>
  </form>
</div>
