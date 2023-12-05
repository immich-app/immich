<script lang="ts">
  import { api, type PersonResponseDto } from '@api';
  import FaceThumbnail from './face-thumbnail.svelte';
  import { createEventDispatcher } from 'svelte';
  import Icon from '../elements/icon.svelte';
  import { mdiClose, mdiMagnify } from '@mdi/js';
  import { handleError } from '$lib/utils/handle-error';
  import LoadingSpinner from '../shared-components/loading-spinner.svelte';
  import { searchNameLocal } from '$lib/utils/person';

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

  const resetSearch = () => {
    name = '';
    people = peopleCopy;
  };

  $: {
    people = peopleCopy.filter(
      (person) => !unselectedPeople.some((unselectedPerson) => unselectedPerson.id === person.id),
    );
    people = searchNameLocal(name, people, 10);
  }

  const searchPeople = async (force: boolean) => {
    if (name === '') {
      people = peopleCopy;
      return;
    }
    if (!force) {
      if (people.length < 20 && name.startsWith(searchWord)) {
        return;
      }
    }

    const timeout = setTimeout(() => (isSearchingPeople = true), 100);
    try {
      const { data } = await api.searchApi.searchPerson({ name });
      people = data;
      searchWord = name;
    } catch (error) {
      handleError(error, "Can't search people");
    } finally {
      clearTimeout(timeout);
    }

    isSearchingPeople = false;
  };
</script>

<div class="flex w-40 sm:w-48 md:w-96 h-14 rounded-lg bg-gray-100 p-2 dark:bg-gray-700 mb-8 gap-2 place-items-center">
  <button on:click={() => searchPeople(true)}>
    <div class="w-fit">
      <Icon path={mdiMagnify} size="24" />
    </div>
  </button>
  <!-- svelte-ignore a11y-autofocus -->
  <input
    autofocus
    class="w-full gap-2 bg-gray-100 dark:bg-gray-700 dark:text-white"
    type="text"
    placeholder="Search names"
    bind:value={name}
    on:input={() => searchPeople(false)}
  />
  {#if name}
    <button on:click={resetSearch}>
      <Icon path={mdiClose} />
    </button>
  {/if}
  {#if isSearchingPeople}
    <div class="flex place-items-center">
      <LoadingSpinner />
    </div>
  {/if}
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
