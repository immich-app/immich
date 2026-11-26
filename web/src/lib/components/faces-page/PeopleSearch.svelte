<script lang="ts">
  import { initInput } from '#lib/actions/focus.ts';
  import { maximumLengthSearchPeople, timeBeforeShowLoadingSpinner } from '#lib/constants.ts';
  import SearchBar from '#lib/elements/SearchBar.svelte';
  import { queryClient } from '#lib/queries/client.ts';
  import { QueryKeys } from '#lib/queries/query-keys.ts';
  import { searchPersonQuery } from '#lib/queries/search.query.ts';
  import { handleError } from '#lib/utils/handle-error.ts';
  import { searchNameLocal } from '#lib/utils/person.ts';
  import { type PersonResponseDto } from '@immich/sdk';
  import { isCancelledError } from '@tanstack/svelte-query';
  import { t } from 'svelte-i18n';

  let searchedPeople: PersonResponseDto[] = [];
  let searchWord: string;
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
    void queryClient.cancelQueries({ queryKey: QueryKeys.searchPerson() });
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
    if (
      !force &&
      searchedPeople.length > 0 &&
      searchedPeople.length < maximumLengthSearchPeople &&
      searchName.startsWith(searchWord)
    ) {
      search();
      return;
    }
    cancelPreviousRequest();
    timeout = setTimeout(() => (showLoadingSpinner = true), timeBeforeShowLoadingSpinner);
    try {
      searchedPeople = await queryClient.query(searchPersonQuery({ name: searchName }));
      searchWord = searchName;
    } catch (error) {
      if (!isCancelledError(error)) {
        handleError(error, $t('errors.cant_search_people'));
      }
    } finally {
      clearTimeout(timeout);
      timeout = null;
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
    onSearch={({ force = false }) => searchPeople(force)}
  />
{:else}
  <input
    class={inputClass}
    type="text"
    {placeholder}
    bind:value={searchName}
    oninput={() => searchPeople(false)}
    {@attach initInput}
  />
{/if}
