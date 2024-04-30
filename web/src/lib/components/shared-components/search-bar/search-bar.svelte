<script lang="ts">
  import { AppRoute } from '$lib/constants';
  import { goto } from '$app/navigation';
  import { isSearchEnabled, preventRaceConditionSearchBar, savedSearchTerms } from '$lib/stores/search.store';
  import { clickOutside } from '$lib/utils/click-outside';
  import { mdiClose, mdiMagnify, mdiTune } from '@mdi/js';
  import SearchHistoryBox from './search-history-box.svelte';
  import SearchFilterBox from './search-filter-box.svelte';
  import type { MetadataSearchDto, SmartSearchDto } from '@immich/sdk';
  import { getMetadataSearchQuery } from '$lib/utils/metadata-search';
  import { handlePromiseError } from '$lib/utils';
  import { shortcuts } from '$lib/utils/shortcut';
  import { focusOutside } from '$lib/utils/focus-outside';
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';

  export let value = '';
  export let grayTheme: boolean;
  export let searchQuery: MetadataSearchDto | SmartSearchDto = {};

  let input: HTMLInputElement;

  let showHistory = false;
  let showFilter = false;
  $: showClearIcon = value.length > 0;

  const onSearch = async (payload: SmartSearchDto | MetadataSearchDto) => {
    const params = getMetadataSearchQuery(payload);

    showHistory = false;
    showFilter = false;
    $isSearchEnabled = false;
    await goto(`${AppRoute.SEARCH}?${params}`);
  };

  const clearSearchTerm = (searchTerm: string) => {
    input.focus();
    $savedSearchTerms = $savedSearchTerms.filter((item) => item !== searchTerm);
  };

  const saveSearchTerm = (saveValue: string) => {
    $savedSearchTerms = [saveValue, ...$savedSearchTerms];

    if ($savedSearchTerms.length > 5) {
      $savedSearchTerms = $savedSearchTerms.slice(0, 5);
    }
  };

  const clearAllSearchTerms = () => {
    input.focus();
    $savedSearchTerms = [];
  };

  const onFocusIn = () => {
    showHistory = true;
    $isSearchEnabled = true;
  };

  const onFocusOut = () => {
    if ($isSearchEnabled) {
      $preventRaceConditionSearchBar = true;
    }

    showHistory = false;
    $isSearchEnabled = false;
    showFilter = false;
  };

  const onHistoryTermClick = async (searchTerm: string) => {
    const searchPayload = { query: searchTerm };
    await onSearch(searchPayload);
  };

  const onFilterClick = () => {
    showFilter = !showFilter;
    value = '';

    if (showFilter) {
      showHistory = false;
    }
  };

  const onSubmit = () => {
    handlePromiseError(onSearch({ query: value }));
    saveSearchTerm(value);
  };
</script>

<svelte:window
  use:shortcuts={[
    { shortcut: { key: 'Escape' }, onShortcut: onFocusOut },
    { shortcut: { ctrl: true, key: 'k' }, onShortcut: () => input.focus() },
    { shortcut: { ctrl: true, shift: true, key: 'k' }, onShortcut: onFilterClick },
  ]}
/>

<div class="w-full relative" use:clickOutside={{ onOutclick: onFocusOut }} use:focusOutside={{ onFocusOut }}>
  <form
    draggable="false"
    autocomplete="off"
    class="select-text text-sm"
    action={AppRoute.SEARCH}
    on:reset={() => (value = '')}
    on:submit|preventDefault={onSubmit}
  >
    <div class="absolute inset-y-0 left-0 flex items-center pl-2">
      <CircleIconButton type="submit" title="Search" icon={mdiMagnify} size="20" />
    </div>
    <label for="main-search-bar" class="sr-only">Search your photos</label>
    <input
      type="text"
      name="q"
      id="main-search-bar"
      class="w-full {grayTheme
        ? 'dark:bg-immich-dark-gray'
        : 'dark:bg-immich-dark-bg'} px-14 py-4 text-immich-fg/75 dark:text-immich-dark-fg {(showHistory &&
        $savedSearchTerms.length > 0) ||
      showFilter
        ? 'rounded-t-3xl border  border-gray-200 bg-white dark:border-gray-800'
        : 'rounded-3xl border border-transparent bg-gray-200'}"
      placeholder="Search your photos"
      required
      pattern="^(?!m:$).*$"
      bind:value
      bind:this={input}
      on:click={onFocusIn}
      on:focus={onFocusIn}
      disabled={showFilter}
      use:shortcuts={[
        { shortcut: { key: 'Escape' }, onShortcut: onFocusOut },
        { shortcut: { ctrl: true, shift: true, key: 'k' }, onShortcut: onFilterClick },
      ]}
    />

    <div class="absolute inset-y-0 {showClearIcon ? 'right-14' : 'right-2'} flex items-center pl-6 transition-all">
      <CircleIconButton title="Show search options" icon={mdiTune} on:click={onFilterClick} size="20" />
    </div>
    {#if showClearIcon}
      <div class="absolute inset-y-0 right-0 flex items-center pr-2">
        <CircleIconButton type="reset" icon={mdiClose} title="Clear" size="20" />
      </div>
    {/if}

    <!-- SEARCH HISTORY BOX -->
    {#if showHistory && $savedSearchTerms.length > 0}
      <SearchHistoryBox
        on:clearAllSearchTerms={clearAllSearchTerms}
        on:clearSearchTerm={({ detail: searchTerm }) => clearSearchTerm(searchTerm)}
        on:selectSearchTerm={({ detail: searchTerm }) => handlePromiseError(onHistoryTermClick(searchTerm))}
      />
    {/if}
  </form>

  {#if showFilter}
    <SearchFilterBox {searchQuery} on:search={({ detail }) => onSearch(detail)} />
  {/if}
</div>
