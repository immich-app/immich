<script lang="ts">
  import ImageThumbnail from '$lib/components/assets/thumbnail/image-thumbnail.svelte';
  import SingleGridRow from '$lib/components/shared-components/single-grid-row.svelte';
  import SearchBar from '$lib/elements/SearchBar.svelte';
  import { getPeopleThumbnailUrl } from '$lib/utils';
  import { handleError } from '$lib/utils/handle-error';
  import { getAllPeople, type PersonResponseDto } from '@immich/sdk';
  import { Button, LoadingSpinner } from '@immich/ui';
  import { mdiArrowRight, mdiClose } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import type { SvelteSet } from 'svelte/reactivity';

  interface Props {
    selectedPeople: SvelteSet<string>;
  }

  let { selectedPeople = $bindable() }: Props = $props();

  let peoplePromise = getPeople();
  let showAllPeople = $state(false);
  let name = $state('');
  let numberOfPeople = $state(1);

  function orderBySelectedPeopleFirst(people: PersonResponseDto[]) {
    return [
      ...people.filter((p) => selectedPeople.has(p.id)), //
      ...people.filter((p) => !selectedPeople.has(p.id)),
    ];
  }

  async function getPeople() {
    try {
      const res = await getAllPeople({ withHidden: false });
      return orderBySelectedPeopleFirst(res.people);
    } catch (error) {
      handleError(error, $t('errors.failed_to_get_people'));
    }
  }

  function togglePersonSelection(id: string) {
    if (selectedPeople.has(id)) {
      selectedPeople.delete(id);
    } else {
      selectedPeople.add(id);
    }
  }

  const filterPeople = (list: PersonResponseDto[], name: string) => {
    const nameLower = name.toLowerCase();
    return name ? list.filter((p) => p.name.toLowerCase().includes(nameLower)) : list;
  };
</script>

{#await peoplePromise}
  <div id="spinner" class="flex h-[217px] items-center justify-center -mb-4">
    <LoadingSpinner size="large" />
  </div>
{:then people}
  {#if people && people.length > 0}
    {@const peopleList = showAllPeople
      ? filterPeople(people, name)
      : filterPeople(people, name).slice(0, numberOfPeople)}

    <div id="people-selection" class="max-h-60 -mb-4 overflow-y-auto immich-scrollbar">
      <div class="flex items-center w-full justify-between gap-6">
        <p class="uppercase immich-form-label py-3">{$t('people')}</p>
        <SearchBar bind:name placeholder={$t('filter_people')} showLoadingSpinner={false} />
      </div>

      <SingleGridRow
        class="grid grid-auto-fill-20 gap-1 mt-2 overflow-y-auto immich-scrollbar"
        bind:itemCount={numberOfPeople}
      >
        {#each peopleList as person (person.id)}
          <button
            type="button"
            class="flex flex-col items-center rounded-3xl border-2 hover:bg-subtle dark:hover:bg-immich-dark-primary/20 p-2 transition-all {selectedPeople.has(
              person.id,
            )
              ? 'dark:border-slate-500 border-slate-400 bg-slate-200 dark:bg-slate-800 dark:text-white'
              : 'border-transparent'}"
            onclick={() => togglePersonSelection(person.id)}
          >
            <ImageThumbnail circle shadow url={getPeopleThumbnailUrl(person)} altText={person.name} widthStyle="100%" />
            <p class="mt-2 line-clamp-2 text-sm font-medium dark:text-white">{person.name}</p>
          </button>
        {/each}
      </SingleGridRow>

      {#if showAllPeople || people.length > peopleList.length}
        <div class="flex justify-center mt-2">
          <Button
            color="primary"
            variant="ghost"
            shape="round"
            leadingIcon={showAllPeople ? mdiClose : mdiArrowRight}
            class="flex gap-2 place-items-center"
            onclick={() => (showAllPeople = !showAllPeople)}
          >
            {showAllPeople ? $t('collapse') : $t('see_all_people')}
          </Button>
        </div>
      {/if}
    </div>
  {/if}
{/await}
