<script lang="ts">
  import { AppRoute } from '$lib/constants';
  import Icon from '$lib/components/elements/icon.svelte';
  import { goto } from '$app/navigation';
  import { isSearchEnabled, preventRaceConditionSearchBar, savedSearchTerms } from '$lib/stores/search.store';
  import { clickOutside } from '$lib/utils/click-outside';
  import { mdiClose, mdiMagnify, mdiTune } from '@mdi/js';
  import IconButton from '$lib/components/elements/buttons/icon-button.svelte';
  import SearchHistoryBox from './search-history-box.svelte';
  import SearchFilterBox from './search-filter-box.svelte';
  import type { MetadataSearchDto, SmartSearchDto } from '@immich/sdk';
  import { getMetadataSearchQuery } from '$lib/utils/metadata-search';
  import { handlePromiseError } from '$lib/utils';
  import { shortcuts } from '$lib/utils/shortcut';
  import { focusOutside } from '$lib/utils/focus-outside';
  import { tick } from 'svelte';
  import { fly, type FlyParams } from 'svelte/transition';

  export let value = '';
  export let grayTheme = false;
  export let searchQuery: MetadataSearchDto | SmartSearchDto = {};
  export let fullWidth = false;
  export let isOpen = false;

  let searchBar: HTMLElement;
  let input: HTMLInputElement;

  let showHistory = false;
  let showFilter = false;

  $: showClearIcon = fullWidth || value.length > 0;

  $: searchBarClasses = fullWidth ? 'absolute inset-x-2.5 top-2.5' : 'relative block w-full';

  $: if (fullWidth && isOpen && input) {
    input.focus();
  }

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

  const onClearIconClick = () => {
    if (value.length === 0) {
      onFocusOut();
    }
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
    isOpen = false;
  };

  const onHistoryTermClick = async (searchTerm: string) => {
    const searchPayload = { query: searchTerm };
    await onSearch(searchPayload);
  };

  const onFilterClick = async () => {
    showFilter = !showFilter;
    value = '';

    if (showFilter) {
      showHistory = false;
    } else {
      await tick();
      input.focus();
    }
  };

  const onSubmit = () => {
    handlePromiseError(onSearch({ query: value }));
    saveSearchTerm(value);
  };

  const animate = (node: Element, args?: FlyParams) => {
    if (fullWidth) {
      return fly(node, args);
    }
    return {};
  };
</script>

<svelte:window
  use:shortcuts={[
    { shortcut: { key: 'Escape' }, onShortcut: onFocusOut },
    { shortcut: { ctrl: true, key: 'k' }, onShortcut: () => input.focus() },
    { shortcut: { ctrl: true, shift: true, key: 'k' }, onShortcut: onFilterClick },
  ]}
/>

<div
  class={searchBarClasses}
  bind:this={searchBar}
  transition:animate={{
    duration: 200,
  }}
  use:clickOutside={{ onOutclick: onFocusOut }}
  use:focusOutside={{ onFocusOut }}
>
  <form
    draggable="false"
    autocomplete="off"
    class="select-text text-sm"
    action={AppRoute.SEARCH}
    on:reset={() => (value = '')}
    on:submit|preventDefault={onSubmit}
  >
    <label>
      <div class="absolute inset-y-0 left-0 flex items-center pl-6">
        <div class="dark:text-immich-dark-fg/75">
          <button class="flex items-center">
            <Icon ariaLabel="search" path={mdiMagnify} size="1.5em" />
          </button>
        </div>
      </div>
      <input
        type="text"
        name="q"
        class="w-full {grayTheme
          ? 'dark:bg-immich-dark-gray'
          : 'dark:bg-immich-dark-bg'} px-14 py-4 pr-[6.25rem] text-immich-fg/75 dark:text-immich-dark-fg {(showHistory &&
          $savedSearchTerms.length > 0) ||
        showFilter
          ? 'rounded-t-3xl border border-gray-200 bg-white opacity-100 dark:border-gray-800'
          : 'rounded-3xl border border-transparent bg-gray-200'}"
        style:padding-right="{showClearIcon ? 6.25 : 4}rem"
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

      <div class="absolute inset-y-0 {showClearIcon ? 'right-14' : 'right-5'} flex items-center pl-6 transition-all">
        <div class="dark:text-immich-dark-fg/75">
          <IconButton on:click={onFilterClick} title="Show search options">
            <Icon path={mdiTune} size="1.5em" />
          </IconButton>
        </div>
      </div>
    </label>
    {#if showClearIcon}
      <div class="absolute inset-y-0 right-0 flex items-center pr-4">
        <button
          type="reset"
          on:click={onClearIconClick}
          class="rounded-full p-2 hover:bg-immich-primary/5 active:bg-immich-primary/10 dark:text-immich-dark-fg/75 dark:hover:bg-immich-dark-primary/25 dark:active:bg-immich-dark-primary/[.35]"
        >
          <Icon ariaLabel="clear" path={mdiClose} size="1.5em" />
        </button>
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
    <div class="absolute w-full">
      <SearchFilterBox {searchQuery} {searchBar} on:search={({ detail }) => onSearch(detail)} />
    </div>
  {/if}
</div>
