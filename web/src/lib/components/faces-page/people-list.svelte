<script lang="ts">
  import { type PersonResponseDto } from '@immich/sdk';
  import FaceThumbnail from './face-thumbnail.svelte';
  import SearchPeople from '$lib/components/faces-page/people-search.svelte';
  import { t } from 'svelte-i18n';
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import { mdiSwapVertical } from '@mdi/js';

  interface Props {
    screenHeight: number;
    people: PersonResponseDto[];
    peopleToNotShow: PersonResponseDto[];
    onSelect: (person: PersonResponseDto) => void;
    handleSearch?: (sortFaces: boolean) => void;
  }

  let { screenHeight, people, peopleToNotShow, onSelect, handleSearch }: Props = $props();
  let searchedPeopleLocal: PersonResponseDto[] = $state([]);
  let sortBySimilarirty = $state(false);
  let name = $state('');

  const showPeople = $derived(
    (name ? searchedPeopleLocal : people).filter(
      (person) => !peopleToNotShow.some((unselectedPerson) => unselectedPerson.id === person.id),
    ),
  );
</script>

<div class="w-40 sm:w-48 md:w-full h-14 flex gap-4 place-items-center">
  <div class="md:w-96">
    <SearchPeople type="searchBar" placeholder={$t('search_people')} bind:searchName={name} bind:searchedPeopleLocal />
  </div>

  {#if handleSearch}
    <CircleIconButton
      icon={mdiSwapVertical}
      onclick={() => {
        sortBySimilarirty = !sortBySimilarirty;
        handleSearch(sortBySimilarirty);
      }}
      color="neutral"
      title={$t('sort_people_by_similarity')}
    ></CircleIconButton>
  {/if}
</div>

<div
  class="immich-scrollbar overflow-y-auto rounded-3xl bg-gray-200 p-10 dark:bg-immich-dark-gray mt-6"
  style:max-height={screenHeight - 400 + 'px'}
>
  <div class="grid-col-2 grid gap-8 md:grid-cols-3 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10">
    {#each showPeople as person (person.id)}
      <FaceThumbnail {person} onClick={() => onSelect(person)} circle border selectable />
    {/each}
  </div>
</div>
