<script lang="ts">
  import { initInput } from '$lib/actions/focus';
  import { maximumLengthSearchPeople, timeBeforeShowLoadingSpinner } from '$lib/constants';
  import SearchBar from '$lib/elements/SearchBar.svelte';
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
    onReset?: () => void;
    onSearch?: () => void;
  }

  let {
    searchName = $bindable(),
    searchedPeopleLocal = $bindable(),
    type,
    numberPeopleToSearch = maximumLengthSearchPeople,
    inputClass = 'w-full gap-2',
    showLoadingSpinner = $bindable(false),
    placeholder = $t('name_or_nickname'),
    onReset = () => {},
    onSearch = () => {},
  }: Props = $props();

  const handleReset = () => {
    reset();
    onReset();
  };

  export async function searchPeople(force?: boolean, name?: string) {
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
</script>

{#if type === 'searchBar'}
  <SearchBar
    bind:name={searchName}
    {showLoadingSpinner}
    {placeholder}
    onReset={handleReset}
    onSearch={({ force }) => searchPeople(force ?? false)}
  />
{:else}
  <input
    class={inputClass}
    type="text"
    {placeholder}
    bind:value={searchName}
    oninput={() => searchPeople(false)}
    use:initInput
  />
{/if}
