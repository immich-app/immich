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

  const reset = () => {
    searchedPeopleLocal = [];
    cancelPreviousRequest();
    onReset();
  };

  const cancelPreviousRequest = () => {
    if (abortController) {
      abortController.abort();
      abortController = null;
    }
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
  };

  export let handleSearch = async (force?: boolean, name?: string) => {
    searchName = name ?? searchName;
    onSearch();
    if (searchName === '') {
      reset();
      return;
    }
    if (!force && searchedPeople.length < maximumLengthSearchPeople && searchName.startsWith(searchWord)) {
      search();
      return;
    }
    cancelPreviousRequest();
    abortController = new AbortController();
    timeout = setTimeout(() => (showLoadingSpinner = true), timeBeforeShowLoadingSpinner);
    try {
      const data = await searchPerson({ name: searchName }, { signal: abortController?.signal });
      searchedPeople = data;
      searchWord = searchName;
    } catch (error) {
      handleError(error, "Can't search people");
    } finally {
      clearTimeout(timeout);
      timeout = null;
      abortController = null;
      showLoadingSpinner = false;
      search();
    }
  };

  const initInput = (element: HTMLInputElement) => {
    element.focus();
  };

  const handleReset = () => {
    reset();
    onReset();
  };
</script>

{#if type === 'searchBar'}
  <SearchBar
    bind:name={searchName}
    {showLoadingSpinner}
    {placeholder}
    on:reset={handleReset}
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
