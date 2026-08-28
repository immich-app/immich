<script lang="ts">
  import { focusOutside } from '$lib/actions/focus-outside';
  import { shortcuts } from '$lib/actions/shortcut';
  import { Route } from '$lib/route';
  import { searchStore } from '$lib/stores/search.svelte';
  import { handlePromiseError } from '$lib/utils';
  import { generateId } from '$lib/utils/generate-id';
  import { IconButton } from '@immich/ui';
  import { mdiClose, mdiMagnify } from '@mdi/js';
  import { onDestroy, tick } from 'svelte';
  import { t } from 'svelte-i18n';
  import SearchFilters from './SearchFilters.svelte';
  import { searchManager } from '$lib/managers/search-manager.svelte';
  import { getSearchTypePlaceholder } from './search-bar-utils';

  type Props = {
    grayTheme: boolean;
  };

  let { grayTheme }: Props = $props();

  let showClearIcon = $derived(searchManager.filter.query.length > 0);
  let placeholder = $derived(
    searchStore.isSearchEnabled ? getSearchTypePlaceholder(searchManager.filter.queryType) : $t('search_your_photos'),
  );

  let input = $state<HTMLInputElement>();
  let searchFilters = $state<ReturnType<typeof SearchFilters>>();
  let showSuggestions = $state(false);
  let selectedId: string | undefined = $state();

  const listboxId = generateId();
  const searchTypeId = generateId();

  onDestroy(() => {
    searchStore.isSearchEnabled = false;
  });

  const handleSearch = async () => {
    closeDropdown();
    searchStore.isSearchEnabled = false;
    await searchManager.submit();
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
    searchManager.filter.query = searchTerm;
    await handleSearch();
  };

  const onSubmit = () => {
    handlePromiseError(handleSearch());
    saveSearchTerm(searchManager.filter.query);
  };

  const onClear = () => {
    searchManager.filter.query = '';
    input?.focus();
  };

  const onEscape = () => {
    closeDropdown();
  };

  const onArrow = async (direction: 1 | -1) => {
    openDropdown();
    await tick();
    searchFilters?.moveSelection(direction);
  };

  const onEnter = (event: KeyboardEvent) => {
    if (!selectedId) {
      return;
    }

    event.preventDefault();
    searchFilters?.selectActiveOption();
  };

  const onInput = () => {
    openDropdown();
    searchFilters?.clearSelection();
  };

  const openDropdown = () => {
    showSuggestions = true;
  };

  const closeDropdown = () => {
    showSuggestions = false;
    searchFilters?.clearSelection();
  };

  const onsubmit = (event: Event) => {
    event.preventDefault();
    onSubmit();
  };
</script>

<svelte:document use:shortcuts={[{ shortcut: { ctrl: true, key: 'k' }, onShortcut: () => input?.select() }]} />

<div class="relative z-auto w-full" use:focusOutside={{ onFocusOut }} tabindex="-1">
  <form
    draggable="false"
    autocomplete="off"
    class="text-sm select-text"
    action={Route.search()}
    onreset={() => (searchManager.filter.query = '')}
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
        class="w-full border-b py-4 ps-14 text-immich-fg/75 transition-all max-md:py-2 dark:text-immich-dark-fg
        {showClearIcon ? 'pe-22.5' : 'pe-14'}
        {grayTheme || showSuggestions ? 'dark:bg-immich-dark-gray' : 'dark:bg-immich-dark-bg'}
        {showSuggestions ? 'rounded-t-3xl shadow-[0_8px_20px_rgba(0,0,0,0.12)]' : 'rounded-3xl bg-gray-200'}
        {searchStore.isSearchEnabled ? 'border-light-200 bg-white dark:border-dark-600' : 'border-transparent'}"
        {placeholder}
        required
        pattern="^(?!m:$).*$"
        bind:value={searchManager.filter.query}
        bind:this={input}
        onfocus={openDropdown}
        oninput={onInput}
        role="combobox"
        aria-controls={listboxId}
        aria-activedescendant={selectedId ?? ''}
        aria-expanded={showSuggestions}
        aria-autocomplete="list"
        aria-describedby={searchTypeId}
        use:shortcuts={[
          { shortcut: { key: 'Escape' }, onShortcut: onEscape },
          { shortcut: { key: 'ArrowUp' }, onShortcut: () => onArrow(-1) },
          { shortcut: { key: 'ArrowDown' }, onShortcut: () => onArrow(1) },
          { shortcut: { key: 'Enter' }, onShortcut: onEnter, preventDefault: false },
          { shortcut: { key: 'ArrowDown', alt: true }, onShortcut: openDropdown },
        ]}
      />

      <SearchFilters
        bind:this={searchFilters}
        id={listboxId}
        isOpen={showSuggestions}
        onClearAllSearchTerms={clearAllSearchTerms}
        onClearSearchTerm={(searchTerm) => clearSearchTerm(searchTerm)}
        onSelectSearchTerm={(searchTerm) => handlePromiseError(onHistoryTermClick(searchTerm))}
        onActiveSelectionChange={(id) => (selectedId = id)}
        onSearch={() => handleSearch()}
      />
    </div>

    {#if showClearIcon}
      <div class="absolute inset-y-0 inset-e-0 flex items-center pe-2">
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
    <div class="absolute inset-y-0 inset-s-0 flex items-center ps-2">
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
