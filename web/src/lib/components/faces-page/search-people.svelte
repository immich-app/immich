<script lang="ts">
  import SearchBar from '$lib/components/elements/search-bar.svelte';
  import { maximumLengthSearchPeople, timeBeforeShowLoadingSpinner } from '$lib/constants';
  import { handleError } from '$lib/utils/handle-error';
  import { searchNameLocal } from '$lib/utils/person';
  import { searchPerson, type PersonResponseDto } from '@immich/sdk';

  export let searchName: string;
  export let searchedPeopleLocal: PersonResponseDto[];
  export let type: 'searchBar' | 'input';
  export let numberPeopleToSearch: number = maximumLengthSearchPeople;
  export let inputClass: string = 'w-full gap-2 bg-immich-bg dark:bg-immich-dark-bg';
  export let showLoadingSpinner: boolean = false;
  export let isSearching: boolean = false;
  export let placeholder: string = 'Name or nickname';
  export let onReset = () => {};
  export let onSearch = () => {};

  let searchedPeople: PersonResponseDto[] = [];
  let searchWord: string;
  let abortController: AbortController | null = null;
  let timeout: NodeJS.Timeout | null = null;

  const search = () => {
    searchedPeopleLocal = searchNameLocal(searchName, searchedPeople, numberPeopleToSearch);
  };

  export let handleSearch = async (force?: boolean, name?: string) => {
    isSearching = true;
    searchName = name ?? searchName;
    onSearch();
    if (searchName === '') {
      searchedPeopleLocal = [];
      isSearching = false;
      onReset();
      return;
    }
    if (!force && searchedPeople.length < maximumLengthSearchPeople && searchName.startsWith(searchWord)) {
      search();
      isSearching = false;
      return;
    }
    if (abortController) {
      abortController.abort();
    }
    if (timeout) {
      clearTimeout(timeout);
    }
    abortController = new AbortController();
    timeout = setTimeout(() => (showLoadingSpinner = true), timeBeforeShowLoadingSpinner);
    try {
      const data = await searchPerson({ name: searchName }, { signal: abortController?.signal });
      abortController = null;
      searchedPeople = data;
      searchWord = searchName;
    } catch (error) {
      handleError(error, "Can't search people");
    } finally {
      clearTimeout(timeout);
    }
    isSearching = false;
    showLoadingSpinner = false;
    search();
  };

  const initInput = (element: HTMLInputElement) => {
    element.focus();
  };
</script>

{#if type === 'searchBar'}
  <SearchBar
    bind:name={searchName}
    {showLoadingSpinner}
    {placeholder}
    on:reset={onReset}
    on:search={({ detail }) => handleSearch(detail.force ?? false)}
  />
{:else}
  <input
    class={inputClass}
    type="text"
    {placeholder}
    bind:value={searchName}
    on:input={() => handleSearch(false)}
    use:initInput
  />
{/if}
