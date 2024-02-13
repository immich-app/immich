<script lang="ts">
  import { maximumLengthSearchPeople, timeBeforeShowLoadingSpinner } from '$lib/constants';
  import { handleError } from '$lib/utils/handle-error';
  import { searchNameLocal } from '$lib/utils/person';
  import { type PersonResponseDto } from '@api';
  import { searchPerson } from '@immich/sdk';
  import { createEventDispatcher } from 'svelte';
  import FaceThumbnail from './face-thumbnail.svelte';
  import SearchBar from './search-bar.svelte';

  export let screenHeight: number;
  export let people: PersonResponseDto[];
  export let peopleCopy: PersonResponseDto[];
  export let unselectedPeople: PersonResponseDto[];

  let name = '';
  let searchWord: string;
  let isSearchingPeople = false;

  let dispatch = createEventDispatcher<{
    select: PersonResponseDto;
  }>();

  $: {
    people = peopleCopy.filter(
      (person) => !unselectedPeople.some((unselectedPerson) => unselectedPerson.id === person.id),
    );
    if (name) {
      people = searchNameLocal(name, people, maximumLengthSearchPeople);
    }
  }

  const searchPeople = async (force: boolean) => {
    if (name === '') {
      people = peopleCopy;
      return;
    }
    if (!force && people.length < maximumLengthSearchPeople && name.startsWith(searchWord)) {
      return;
    }

    const timeout = setTimeout(() => (isSearchingPeople = true), timeBeforeShowLoadingSpinner);
    try {
      people = await searchPerson({ name });
      searchWord = name;
    } catch (error) {
      handleError(error, "Can't search people");
    } finally {
      clearTimeout(timeout);
    }

    isSearchingPeople = false;
  };
</script>

<div class=" w-40 sm:w-48 md:w-96 h-14 mb-8">
  <SearchBar
    bind:name
    {isSearchingPeople}
    on:reset={() => {
      people = peopleCopy;
    }}
    on:search={({ detail }) => searchPeople(detail.force ?? false)}
  />
</div>

<div
  class="immich-scrollbar overflow-y-auto rounded-3xl bg-gray-200 p-10 dark:bg-immich-dark-gray"
  style:max-height={screenHeight - 400 + 'px'}
>
  <div class="grid-col-2 grid gap-8 md:grid-cols-3 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10">
    {#each people as person (person.id)}
      <FaceThumbnail
        {person}
        on:click={() => {
          dispatch('select', person);
        }}
        circle
        border
        selectable
      />
    {/each}
  </div>
</div>
