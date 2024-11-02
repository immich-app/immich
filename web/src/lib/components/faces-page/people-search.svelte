<script lang="ts">
  import { initInput } from '$lib/actions/focus';
  import SearchBar from '$lib/components/elements/search-bar.svelte';
  import { maximumLengthSearchPeople, timeBeforeShowLoadingSpinner } from '$lib/constants';
  import { handleError } from '$lib/utils/handle-error';
  import { searchNameLocal } from '$lib/utils/person';
  import { searchPerson, type PersonResponseDto } from '@immich/sdk';
  import { t } from 'svelte-i18n';


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

  interface Props {
    searchName: string;
    searchedPeopleLocal: PersonResponseDto[];
    type: 'searchBar' | 'input';
    numberPeopleToSearch?: number;
    inputClass?: string;
    showLoadingSpinner?: boolean;
    placeholder?: string;
    onReset?: any;
    onSearch?: any;
    handleSearch?: any;
  }

  let {
    searchName = $bindable(),
    searchedPeopleLocal = $bindable(),
    type,
    numberPeopleToSearch = maximumLengthSearchPeople,
    inputClass = 'w-full gap-2 bg-immich-bg dark:bg-immich-dark-bg',
    showLoadingSpinner = $bindable(false),
    placeholder = $t('name_or_nickname'),
    onReset = () => {},
    onSearch = () => {},
    handleSearch = async (force?: boolean, name?: string) => {
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
      handleError(error, $t('errors.cant_search_people'));
    } finally {
      clearTimeout(timeout);
      timeout = null;
      abortController = null;
      showLoadingSpinner = false;
      search();
    }
  }
  }: Props = $props();

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
    onReset={handleReset}
    onSearch={({ force }) => handleSearch(force ?? false)}
  />
{:else}
  <input
    class={inputClass}
    type="text"
    {placeholder}
    bind:value={searchName}
    oninput={() => handleSearch(false)}
    use:initInput
  />
{/if}
