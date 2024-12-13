<script lang="ts">
  import ImageThumbnail from '$lib/components/assets/thumbnail/image-thumbnail.svelte';
  import Button from '$lib/components/elements/buttons/button.svelte';
  import SearchBar from '$lib/components/elements/search-bar.svelte';
  import Icon from '$lib/components/elements/icon.svelte';
  import { getPeopleThumbnailUrl } from '$lib/utils';
  import { getAllPeople, type PersonResponseDto } from '@immich/sdk';
  import { mdiClose, mdiArrowRight } from '@mdi/js';
  import { handleError } from '$lib/utils/handle-error';
  import { t } from 'svelte-i18n';
  import SingleGridRow from '$lib/components/shared-components/single-grid-row.svelte';
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

{#await peoplePromise then people}
  {#if people && people.length > 0}
    {@const peopleList = showAllPeople
      ? filterPeople(people, name)
      : filterPeople(people, name).slice(0, numberOfPeople)}

    <div id="people-selection" class="-mb-4">
      <div class="flex items-center w-full justify-between gap-6">
        <p class="immich-form-label py-3">{$t('people').toUpperCase()}</p>
        <SearchBar bind:name placeholder={$t('filter_people')} showLoadingSpinner={false} />
      </div>

      <SingleGridRow
        class="grid grid-auto-fill-20 -mx-1 gap-1 mt-2 overflow-y-auto immich-scrollbar"
        bind:itemCount={numberOfPeople}
      >
        {#each peopleList as person (person.id)}
          <button
            type="button"
            class="flex flex-col items-center rounded-3xl border-2 hover:bg-immich-gray dark:hover:bg-immich-dark-primary/20 p-2 transition-all {selectedPeople.has(
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
            shadow={false}
            color="text-primary"
            class="flex gap-2 place-items-center"
            onclick={() => (showAllPeople = !showAllPeople)}
          >
            {#if showAllPeople}
              <span><Icon path={mdiClose} ariaHidden /></span>
              {$t('collapse')}
            {:else}
              <span><Icon path={mdiArrowRight} ariaHidden /></span>
              {$t('see_all_people')}
            {/if}
          </Button>
        </div>
      {/if}
    </div>
  {/if}
{/await}
