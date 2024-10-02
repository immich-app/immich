<script lang="ts">
  import { AppRoute } from '$lib/constants';
  import { goto } from '$app/navigation';
  import { isSearchEnabled, preventRaceConditionSearchBar, savedSearchTerms } from '$lib/stores/search.store';
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
  import { tick } from 'svelte';

  export let value = '';
  export let grayTheme: boolean;
  export let searchQuery: MetadataSearchDto | SmartSearchDto = {};

  $: showClearIcon = value.length > 0;

  let input: HTMLInputElement;

  let showSuggestions = false;
  let showFilter = false;
  let isSearchSuggestions = false;
  let selectedId: string | undefined;
  let moveSelection: (direction: 1 | -1) => void;
  let clearSelection: () => void;
  let selectActiveOption: () => void;

  const listboxId = generateId();

  const onSearch = async (payload: SmartSearchDto | MetadataSearchDto) => {
    const params = getMetadataSearchQuery(payload);

    closeDropdown();
    showFilter = false;
    $isSearchEnabled = false;
    await goto(`${AppRoute.SEARCH}?${params}`);
  };

  const clearSearchTerm = (searchTerm: string) => {
    input.focus();
    $savedSearchTerms = $savedSearchTerms.filter((item) => item !== searchTerm);
  };

  const saveSearchTerm = (saveValue: string) => {
    const filteredSearchTerms = $savedSearchTerms.filter((item) => item.toLowerCase() !== saveValue.toLowerCase());
    $savedSearchTerms = [saveValue, ...filteredSearchTerms];

    if ($savedSearchTerms.length > 5) {
      $savedSearchTerms = $savedSearchTerms.slice(0, 5);
    }
  };

  const clearAllSearchTerms = () => {
    input.focus();
    $savedSearchTerms = [];
  };

  const onFocusIn = () => {
    $isSearchEnabled = true;
  };

  const onFocusOut = () => {
    if ($isSearchEnabled) {
      $preventRaceConditionSearchBar = true;
    }

    closeDropdown();
    $isSearchEnabled = false;
    showFilter = false;
  };

  const onHistoryTermClick = async (searchTerm: string) => {
    value = searchTerm;
    const searchPayload = { query: searchTerm };
    await onSearch(searchPayload);
  };

  const onFilterClick = () => {
    showFilter = !showFilter;
    value = '';

    if (showFilter) {
      closeDropdown();
    }
  };

  const onSubmit = () => {
    handlePromiseError(onSearch({ query: value }));
    saveSearchTerm(value);
  };

  const onClear = () => {
    value = '';
    input.focus();
  };

  const onEscape = () => {
    closeDropdown();
    showFilter = false;
  };

  const onArrow = async (direction: 1 | -1) => {
    openDropdown();
    await tick();
    moveSelection(direction);
  };

  const onEnter = (event: KeyboardEvent) => {
    if (selectedId) {
      event.preventDefault();
      selectActiveOption();
    }
  };

  const onInput = () => {
    openDropdown();
    clearSelection();
  };

  const openDropdown = () => {
    showSuggestions = true;
  };

  const closeDropdown = () => {
    showSuggestions = false;
    clearSelection();
  };
</script>

<svelte:window
  use:shortcuts={[
    { shortcut: { key: 'Escape' }, onShortcut: onEscape },
    { shortcut: { ctrl: true, key: 'k' }, onShortcut: () => input.select() },
    { shortcut: { ctrl: true, shift: true, key: 'k' }, onShortcut: onFilterClick },
  ]}
/>

<div class="w-full relative" use:focusOutside={{ onFocusOut }} tabindex="-1">
  <form
    draggable="false"
    autocomplete="off"
    class="select-text text-sm"
    action={AppRoute.SEARCH}
    on:reset={() => (value = '')}
    on:submit|preventDefault={onSubmit}
    on:focusin={onFocusIn}
    role="search"
  >
    <div use:focusOutside={{ onFocusOut: closeDropdown }} tabindex="-1">
      <label for="main-search-bar" class="sr-only">{$t('search_your_photos')}</label>
      <input
        type="text"
        name="q"
        id="main-search-bar"
        class="w-full transition-all border-2 px-14 py-4 text-immich-fg/75 dark:text-immich-dark-fg
        {grayTheme ? 'dark:bg-immich-dark-gray' : 'dark:bg-immich-dark-bg'}
        {showSuggestions && isSearchSuggestions ? 'rounded-t-3xl' : 'rounded-3xl bg-gray-200'}
        {$isSearchEnabled && !showFilter ? 'border-gray-200 dark:border-gray-700 bg-white' : 'border-transparent'}"
        placeholder={$t('search_your_photos')}
        required
        pattern="^(?!m:$).*$"
        bind:value
        bind:this={input}
        on:focus={openDropdown}
        on:input={onInput}
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
        id={listboxId}
        searchQuery={value}
        isOpen={showSuggestions}
        bind:isSearchSuggestions
        bind:moveSelection
        bind:clearSelection
        bind:selectActiveOption
        onClearAllSearchTerms={clearAllSearchTerms}
        onClearSearchTerm={(searchTerm) => clearSearchTerm(searchTerm)}
        onSelectSearchTerm={(searchTerm) => handlePromiseError(onHistoryTermClick(searchTerm))}
        onActiveSelectionChange={(id) => (selectedId = id)}
      />
    </div>

    <div class="absolute inset-y-0 {showClearIcon ? 'right-14' : 'right-2'} flex items-center pl-6 transition-all">
      <CircleIconButton title={$t('show_search_options')} icon={mdiTune} on:click={onFilterClick} size="20" />
    </div>
    {#if showClearIcon}
      <div class="absolute inset-y-0 right-0 flex items-center pr-2">
        <CircleIconButton on:click={onClear} icon={mdiClose} title={$t('clear')} size="20" />
      </div>
    {/if}
    <div class="absolute inset-y-0 left-0 flex items-center pl-2">
      <CircleIconButton type="submit" disabled={showFilter} title={$t('search')} icon={mdiMagnify} size="20" />
    </div>
  </form>

  {#if showFilter}
    <SearchFilterModal {searchQuery} onSearch={(payload) => onSearch(payload)} onClose={() => (showFilter = false)} />
  {/if}
</div>
