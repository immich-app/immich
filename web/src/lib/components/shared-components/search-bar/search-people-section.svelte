<script lang="ts">
  import ImageThumbnail from '$lib/components/assets/thumbnail/image-thumbnail.svelte';
  import Icon from '$lib/components/elements/icon.svelte';
  import SearchBar from '$lib/components/elements/search-bar.svelte';
  import LoadingSpinner from '$lib/components/shared-components/loading-spinner.svelte';
  import SingleGridRow from '$lib/components/shared-components/single-grid-row.svelte';
  import { getPeopleThumbnailUrl } from '$lib/utils';
  import { handleError } from '$lib/utils/handle-error';
  import { getAllPeople, type PersonResponseDto } from '@immich/sdk';
  import { Button, IconButton } from '@immich/ui';
  import { mdiArrowRight, mdiClose, mdiPlus } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import type { SvelteSet } from 'svelte/reactivity';

  interface Props {
    selectedPeople: SvelteSet<string>;
    personSearchBehavior?: 'and' | 'or' | 'only';
  }

  let { selectedPeople = $bindable(), personSearchBehavior = $bindable('and') }: Props = $props();

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
    <LoadingSpinner size="24" />
  </div>
{:then people}
  {#if people && people.length > 0}
    {@const peopleList = showAllPeople
      ? filterPeople(people, name)
      : filterPeople(people, name).slice(0, numberOfPeople)}

    <div id="people-selection" class="max-h-60 -mb-4 overflow-y-auto immich-scrollbar">
      <div class="flex items-center w-full justify-between gap-6">
        <div class="flex items-center gap-3">
          <p class="immich-form-label py-3">{$t('people').toUpperCase()}</p>
          <IconButton
            color="primary"
            variant="ghost"
            shape="round"
            icon={mdiPlus}
            size="tiny"
            title={$t('add_people')}
            onclick={() => (showAllPeople = true)}
          />
        </div>
        <SearchBar bind:name placeholder={$t('filter_people')} showLoadingSpinner={false} />
      </div>

      {#if selectedPeople.size > 1}
        <div class="flex items-center justify-center gap-4 my-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
          <p class="text-sm font-medium dark:text-white">{$t('search_behavior')}:</p>
          <div class="flex bg-white dark:bg-gray-600 rounded-md p-1">
            <button
              type="button"
              class="px-3 py-1 text-sm rounded transition-colors {personSearchBehavior === 'and'
                ? 'bg-immich-primary text-white'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-500'}"
              onclick={() => (personSearchBehavior = 'and')}
            >
              {$t('all_people')}
            </button>
            <button
              type="button"
              class="px-3 py-1 text-sm rounded transition-colors {personSearchBehavior === 'or'
                ? 'bg-immich-primary text-white'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-500'}"
              onclick={() => (personSearchBehavior = 'or')}
            >
              {$t('any_people')}
            </button>
            <button
              type="button"
              class="px-3 py-1 text-sm rounded transition-colors {personSearchBehavior === 'only'
                ? 'bg-immich-primary text-white'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-500'}"
              onclick={() => (personSearchBehavior = 'only')}
            >
              {$t('only_people')}
            </button>
          </div>
        </div>
      {/if}

      <!-- Selected People Display -->
      {#if selectedPeople.size > 0}
        <div class="mb-4">
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">{$t('selected_people')} ({selectedPeople.size}):</p>
          <div class="flex flex-wrap gap-2">
            {#each people.filter((p) => selectedPeople.has(p.id)) as person (person.id)}
              <div class="flex items-center gap-2 bg-immich-primary/20 rounded-full px-3 py-1">
                <ImageThumbnail
                  circle
                  shadow
                  url={getPeopleThumbnailUrl(person)}
                  altText={person.name}
                  widthStyle="24px"
                  heightStyle="24px"
                />
                <span class="text-sm font-medium">{person.name}</span>
                <button
                  type="button"
                  class="text-gray-500 hover:text-red-500 transition-colors"
                  onclick={() => togglePersonSelection(person.id)}
                  title={$t('remove_person')}
                >
                  <Icon path={mdiClose} size="16" />
                </button>
              </div>
            {/each}
          </div>
        </div>
      {/if}

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
