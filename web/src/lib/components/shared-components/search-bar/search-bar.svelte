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
  export let value = '';
  export let grayTheme: boolean;

  let input: HTMLInputElement;

  let showHistory = false;
  let showFilter = false;
  $: showClearIcon = value.length > 0;

  function onSearch() {
    let smartSearch = 'true';
    let searchValue = value;

    if (value.slice(0, 2) == 'm:') {
      smartSearch = 'false';
      searchValue = value.slice(2);
    }

    $savedSearchTerms = $savedSearchTerms.filter((item) => item !== value);
    saveSearchTerm(value);

    const parameters = new URLSearchParams({
      q: searchValue,
      smart: smartSearch,
    });

    showHistory = false;
    $isSearchEnabled = false;
    goto(`${AppRoute.SEARCH}?${parameters}`, { invalidateAll: true });
  }

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
  };
</script>

<div role="button" class="w-full" use:clickOutside on:outclick={onFocusOut} on:escape={onFocusOut}>
  <form
    draggable="false"
    autocomplete="off"
    class="relative select-text text-sm"
    action={AppRoute.SEARCH}
    on:reset={() => (value = '')}
    on:submit|preventDefault={() => onSearch()}
  >
    <label>
      <div class="absolute inset-y-0 left-0 flex items-center pl-6">
        <div class="dark:text-immich-dark-fg/75">
          <button class="flex items-center">
            <Icon path={mdiMagnify} size="1.5em" />
          </button>
        </div>
      </div>
      <input
        type="text"
        name="q"
        class="w-full {grayTheme
          ? 'dark:bg-immich-dark-gray'
          : 'dark:bg-immich-dark-bg'} px-14 py-4 text-immich-fg/75 dark:text-immich-dark-fg {showHistory || showFilter
          ? 'rounded-t-3xl border  border-gray-200 bg-white dark:border-gray-800'
          : 'rounded-3xl border border-transparent bg-gray-200'}"
        placeholder="Search your photos"
        required
        pattern="^(?!m:$).*$"
        bind:value
        bind:this={input}
        on:click={onFocusIn}
        disabled={showFilter}
      />

      <div class="absolute inset-y-0 right-5 flex items-center pl-6">
        <div class="dark:text-immich-dark-fg/75">
          <IconButton on:click={() => (showFilter = !showFilter)} title="Show search options">
            <Icon path={mdiTune} size="1.5em" />
          </IconButton>
        </div>
      </div>
    </label>
    {#if showClearIcon}
      <div class="absolute inset-y-0 right-0 flex items-center pr-4">
        <button
          type="reset"
          class="rounded-full p-2 hover:bg-immich-primary/5 active:bg-immich-primary/10 dark:text-immich-dark-fg/75 dark:hover:bg-immich-dark-primary/25 dark:active:bg-immich-dark-primary/[.35]"
        >
          <Icon path={mdiClose} size="1.5em" />
        </button>
      </div>
    {/if}

    <!-- SEARCH HISTORY BOX -->
    {#if showHistory}
      <SearchHistoryBox
        on:clearAllSearchTerms={clearAllSearchTerms}
        on:clearSearchTerm={({ detail: searchTerm }) => clearSearchTerm(searchTerm)}
        on:selectSearchTerm={({ detail: searchTerm }) => {
          value = searchTerm;
          onSearch();
        }}
      />
    {/if}

    {#if showFilter}
      <SearchFilterBox />
    {/if}
  </form>
</div>
