<script lang="ts">
  import SearchPeople from '$lib/components/faces-page/PeopleSearch.svelte';
  import { type PersonResponseDto } from '@immich/sdk';
  import { t } from 'svelte-i18n';
  import FaceThumbnail from './FaceThumbnail.svelte';
  import { mdiSwapVertical } from '@mdi/js';
  import { IconButton } from '@immich/ui';

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

<div class="flex h-14 w-40 place-items-center gap-4 sm:w-48 md:w-full">
  <div class="md:w-96">
    <SearchPeople type="searchBar" placeholder={$t('search_people')} bind:searchName={name} bind:searchedPeopleLocal />
  </div>

  {#if handleSearch}
    <IconButton
      shape="round"
      color="secondary"
      variant="ghost"
      icon={mdiSwapVertical}
      onclick={() => {
        sortBySimilarirty = !sortBySimilarirty;
        handleSearch(sortBySimilarirty);
      }}
      aria-label={$t('sort_people_by_similarity')}
    />
  {/if}
</div>

<div
  class="mt-6 overflow-y-auto rounded-3xl bg-gray-200 p-10 immich-scrollbar dark:bg-immich-dark-gray"
  style:max-height={screenHeight - 400 + 'px'}
>
  <div class="grid-col-2 grid gap-8 md:grid-cols-3 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10">
    {#each showPeople as person (person.id)}
      <FaceThumbnail {person} onClick={() => onSelect(person)} circle border selectable />
    {/each}
  </div>
</div>
