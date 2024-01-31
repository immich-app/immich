<script lang="ts">
  import { AppRoute } from '$lib/constants';
  import Icon from '$lib/components/elements/icon.svelte';
  import { goto } from '$app/navigation';
  import { isSearchEnabled, preventRaceConditionSearchBar, savedSearchTerms } from '$lib/stores/search.store';
  import { fly } from 'svelte/transition';
  import { clickOutside } from '$lib/utils/click-outside';
  import { mdiClose, mdiMagnify } from '@mdi/js';
  export let value = '';
  export let grayTheme: boolean;

  let input: HTMLInputElement;

  let showBigSearchBar = false;
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

    showBigSearchBar = false;
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
    showBigSearchBar = true;
    $isSearchEnabled = true;
  };

  const onFocusOut = () => {
    if ($isSearchEnabled) {
      $preventRaceConditionSearchBar = true;
    }

    showBigSearchBar = false;
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
          : 'dark:bg-immich-dark-bg'} px-14 py-4 text-immich-fg/75 dark:text-immich-dark-fg {showBigSearchBar
          ? 'rounded-t-3xl border  border-gray-200 bg-white dark:border-gray-800'
          : 'rounded-3xl border border-transparent bg-gray-200'}"
        placeholder="Search your photos"
        required
        pattern="^(?!m:$).*$"
        bind:value
        bind:this={input}
        on:click={onFocusIn}
      />
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

    {#if showBigSearchBar}
      <div
        transition:fly={{ y: 25, duration: 250 }}
        class="absolute w-full rounded-b-3xl border border-gray-200 bg-white pb-5 shadow-2xl transition-all dark:border-gray-800 dark:bg-immich-dark-gray dark:text-gray-300"
      >
        <div class="flex px-5 pt-5 text-left text-sm">
          <p>
            Smart search is enabled by default, to search for metadata use the syntax <span
              class="rounded-lg bg-gray-100 p-2 font-mono font-semibold leading-7 text-immich-primary dark:bg-gray-900 dark:text-immich-dark-primary"
              >m:your-search-term</span
            >
          </p>
        </div>

        {#if $savedSearchTerms.length > 0}
          <div class="flex items-center justify-between px-5 pt-5 text-xs">
            <p>RECENT SEARCHES</p>
            <div class="flex w-18 items-center justify-center">
              <button
                type="button"
                class="rounded-lg p-2 font-semibold text-immich-primary hover:bg-immich-primary/25 dark:text-immich-dark-primary"
                on:click={clearAllSearchTerms}>Clear all</button
              >
            </div>
          </div>
        {/if}

        {#each $savedSearchTerms as savedSearchTerm, index (index)}
          <div
            class="flex w-full items-center justify-between text-sm text-black hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-500/10"
          >
            <div class="relative w-full items-center">
              <button
                type="button"
                class="relative flex w-full cursor-pointer gap-3 py-3 pl-5"
                on:click={() => {
                  value = savedSearchTerm;
                  onSearch();
                }}
              >
                <Icon path={mdiMagnify} size="1.5em" />
                {savedSearchTerm}
              </button>
              <div class="absolute right-5 top-0 items-center justify-center py-3">
                <button type="button" on:click={() => clearSearchTerm(savedSearchTerm)}
                  ><Icon path={mdiClose} size="18" /></button
                >
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </form>
</div>
