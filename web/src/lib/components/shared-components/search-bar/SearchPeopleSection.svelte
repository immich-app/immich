<script lang="ts">
  import ImageThumbnail from '$lib/components/assets/thumbnail/ImageThumbnail.svelte';
  import SingleGridRow from '$lib/components/shared-components/SingleGridRow.svelte';
  import SearchBar from '$lib/elements/SearchBar.svelte';
  import { getPeopleThumbnailUrl } from '$lib/utils';
  import { handleError } from '$lib/utils/handle-error';
  import { getAllPeople, type PersonResponseDto } from '@immich/sdk';
  import { Button, LoadingSpinner, Text } from '@immich/ui';
  import { mdiArrowRight, mdiClose } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import type { SvelteSet } from 'svelte/reactivity';
  import { tv } from 'tailwind-variants';

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

  const styles = tv({
    base: 'flex flex-col items-center rounded-3xl border-2 p-2 transition-all hover:bg-subtle dark:hover:bg-immich-dark-primary/20',
    variants: {
      selected: {
        true: 'border-slate-400 bg-slate-200 dark:border-slate-500 dark:bg-slate-800 dark:text-white',
        false: 'border-transparent',
      },
    },
  });
</script>

{#await peoplePromise}
  <div id="spinner" class="-mb-4 flex h-54 items-center justify-center">
    <LoadingSpinner size="large" />
  </div>
{:then people}
  {#if people && people.length > 0}
    {@const peopleList = showAllPeople
      ? filterPeople(people, name)
      : filterPeople(people, name).slice(0, numberOfPeople)}

    <div id="people-selection" class="-mb-4 max-h-60 overflow-y-auto immich-scrollbar">
      <div class="flex w-full items-center justify-between gap-6">
        <Text class="py-3" fontWeight="medium">{$t('people')}</Text>
        <SearchBar bind:name placeholder={$t('filter_people')} showLoadingSpinner={false} />
      </div>

      <SingleGridRow
        class="space-between mt-2 grid grid-auto-fill-20 gap-1 overflow-y-auto immich-scrollbar"
        bind:itemCount={numberOfPeople}
      >
        {#each peopleList as person (person.id)}
          <button
            type="button"
            class={styles({ selected: selectedPeople.has(person.id) })}
            onclick={() => togglePersonSelection(person.id)}
          >
            <ImageThumbnail circle shadow url={getPeopleThumbnailUrl(person)} altText={person.name} widthStyle="100%" />
            <p class="mt-2 line-clamp-2 text-sm font-medium dark:text-white">{person.name}</p>
          </button>
        {/each}
      </SingleGridRow>

      {#if showAllPeople || people.length > peopleList.length}
        <div class="mt-2 flex justify-center">
          <Button
            color="primary"
            variant="ghost"
            shape="round"
            leadingIcon={showAllPeople ? mdiClose : mdiArrowRight}
            class="flex place-items-center gap-2"
            onclick={() => (showAllPeople = !showAllPeople)}
          >
            {showAllPeople ? $t('collapse') : $t('see_all_people')}
          </Button>
        </div>
      {/if}
    </div>
  {/if}
{/await}
