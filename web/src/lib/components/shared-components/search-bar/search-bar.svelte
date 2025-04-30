<script lang="ts">
  import { AppRoute } from '$lib/constants';
  import { goto } from '$app/navigation';
  import { searchStore } from '$lib/stores/search.svelte';
  import { mdiClose, mdiMagnify, mdiTune } from '@mdi/js';
  import SearchHistoryBox from './search-history-box.svelte';
  import SearchFilterModal from './search-filter-modal.svelte';
  import type { MetadataSearchDto, SmartSearchDto } from '@immich/sdk';
  import { getMetadataSearchQuery } from '$lib/utils/metadata-search';
  import { handlePromiseError } from '$lib/utils';
  import { shortcuts } from '$lib/actions/shortcut';
  import { focusOutside } from '$lib/actions/focus-outside';
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import { t } from 'svelte-i18n';
  import { generateId } from '$lib/utils/generate-id';
  import { onDestroy, tick } from 'svelte';

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
  let showFilter = $state(false);
  let isSearchSuggestions = $state(false);
  let selectedId: string | undefined = $state();
  let isFocus = $state(false);

  const listboxId = generateId();

  onDestroy(() => {
    searchStore.isSearchEnabled = false;
  });

  const handleSearch = async (payload: SmartSearchDto | MetadataSearchDto) => {
    const params = getMetadataSearchQuery(payload);

    closeDropdown();
    showFilter = false;
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
  };

  const onFocusOut = () => {
    searchStore.isSearchEnabled = false;
  };

  const onHistoryTermClick = async (searchTerm: string) => {
    value = searchTerm;
    const searchPayload = { query: searchTerm };
    await handleSearch(searchPayload);
  };

  const onFilterClick = () => {
    showFilter = !showFilter;
    value = '';

    if (showFilter) {
      closeDropdown();
    }
  };

  const onSubmit = () => {
    const searchType = getSearchType();
    let payload: SmartSearchDto | MetadataSearchDto = {} as SmartSearchDto | MetadataSearchDto;

    switch (searchType) {
      case 'smart': {
        payload = { query: value } as SmartSearchDto;
        break;
      }
      case 'metadata': {
        payload = { originalFileName: value } as MetadataSearchDto;
        break;
      }
      case 'description': {
        payload = { description: value } as MetadataSearchDto;
        break;
      }
    }

    handlePromiseError(handleSearch(payload));
    saveSearchTerm(value);
  };

  const onClear = () => {
    value = '';
    input?.focus();
  };

  const onEscape = () => {
    closeDropdown();
    showFilter = false;
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
    isFocus = true;
  };

  const closeDropdown = () => {
    showSuggestions = false;
    isFocus = false;
    searchHistoryBox?.clearSelection();
  };

  const onsubmit = (event: Event) => {
    event.preventDefault();
    onSubmit();
  };

  function getSearchType(): 'smart' | 'metadata' | 'description' {
    const searchType = localStorage.getItem('searchQueryType');
    switch (searchType) {
      case 'smart': {
        return 'smart';
      }
      case 'metadata': {
        return 'metadata';
      }
      case 'description': {
        return 'description';
      }
      default: {
        return 'smart';
      }
    }
  }

  function getSearchTypeText(): string {
    const searchType = getSearchType();
    switch (searchType) {
      case 'smart': {
        return $t('context');
      }
      case 'metadata': {
        return $t('filename');
      }
      case 'description': {
        return $t('description');
      }
    }
  }
</script>

<svelte:window
  use:shortcuts={[
    { shortcut: { key: 'Escape' }, onShortcut: onEscape },
    { shortcut: { ctrl: true, key: 'k' }, onShortcut: () => input?.select() },
    { shortcut: { ctrl: true, shift: true, key: 'k' }, onShortcut: onFilterClick },
  ]}
/>

<div class="w-full relative" use:focusOutside={{ onFocusOut }} tabindex="-1">
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
        class="w-full transition-all border-2 px-14 py-4 max-md:py-2 text-immich-fg/75 dark:text-immich-dark-fg
        {grayTheme ? 'dark:bg-immich-dark-gray' : 'dark:bg-immich-dark-bg'}
        {showSuggestions && isSearchSuggestions ? 'rounded-t-3xl' : 'rounded-3xl bg-gray-200'}
        {searchStore.isSearchEnabled && !showFilter
          ? 'border-gray-200 dark:border-gray-700 bg-white'
          : 'border-transparent'}"
        placeholder={$t('search_your_photos')}
        required
        pattern="^(?!m:$).*$"
        bind:value
        bind:this={input}
        onfocus={openDropdown}
        oninput={onInput}
        disabled={showFilter}
        role="combobox"
        aria-controls={listboxId}
        aria-activedescendant={selectedId ?? ''}
        aria-expanded={showSuggestions && isSearchSuggestions}
        aria-autocomplete="list"
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
      <CircleIconButton title={$t('show_search_options')} icon={mdiTune} onclick={onFilterClick} size="20" />
    </div>

    {#if isFocus}
      <div
        class="absolute inset-y-0 flex items-center"
        class:end-16={isFocus}
        class:end-28={isFocus && value.length > 0}
      >
        <p
          class="bg-immich-primary text-white dark:bg-immich-dark-primary/90 dark:text-black/75 rounded-full px-3 py-1 text-xs z-10"
        >
          {getSearchTypeText()}
        </p>
      </div>
    {/if}

    {#if showClearIcon}
      <div class="absolute inset-y-0 end-0 flex items-center pe-2">
        <CircleIconButton onclick={onClear} icon={mdiClose} title={$t('clear')} size="20" />
      </div>
    {/if}
    <div class="absolute inset-y-0 start-0 flex items-center ps-2">
      <CircleIconButton
        type="submit"
        disabled={showFilter}
        title={$t('search')}
        icon={mdiMagnify}
        size="20"
        onclick={() => {}}
      />
    </div>
  </form>

  {#if showFilter}
    <SearchFilterModal
      {searchQuery}
      onSearch={(payload) => handleSearch(payload)}
      onClose={() => (showFilter = false)}
    />
  {/if}
</div>
