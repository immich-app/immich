<script lang="ts" generics="T extends { id: string }">
  import ImageThumbnail from '$lib/components/assets/thumbnail/image-thumbnail.svelte';
  import ControlAppBar from '$lib/components/shared-components/control-app-bar.svelte';
  import SearchBar from '$lib/elements/SearchBar.svelte';
  import { handleError } from '$lib/utils/handle-error';
  import { Button, Icon, IconButton, modalManager, toastManager } from '@immich/ui';
  import { mdiCallMerge, mdiMerge, mdiSwapHorizontal, mdiSwapVertical } from '@mdi/js';
  import { onMount } from 'svelte';
  import { flip } from 'svelte/animate';
  import { quintOut } from 'svelte/easing';
  import { fly } from 'svelte/transition';
  import { t } from 'svelte-i18n';

  interface Props {
    person: T;
    getDisplayName: (person: T) => string;
    getThumbnailUrl: (person: T) => string;
    loadPeople: (sortFaces: boolean, person: T) => Promise<T[]>;
    mergePeople: (person: T, selectedPeople: T[]) => Promise<T | void>;
    onBack: () => void;
    onMerge: (mergedPerson: T) => void;
    onSwapPerson?: (person: T) => Promise<void> | void;
    searchPeople?: (name: string) => Promise<T[]>;
    showSimilaritySort?: boolean;
    mergeLimit?: number;
    loadErrorMessage?: string;
    mergeErrorMessage?: string;
  }

  let {
    person = $bindable(),
    getDisplayName,
    getThumbnailUrl,
    loadPeople,
    mergePeople,
    onBack,
    onMerge,
    onSwapPerson = () => {},
    searchPeople,
    showSimilaritySort = true,
    mergeLimit = 5,
    loadErrorMessage,
    mergeErrorMessage,
  }: Props = $props();

  let people: T[] = $state([]);
  let searchedPeople: T[] = $state([]);
  let selectedPeople: T[] = $state([]);
  let searchName = $state('');
  let showLoadingSpinner = $state(false);
  let sortBySimilarity = $state(false);
  let screenHeight = $state(0);

  const hasSelection = $derived(selectedPeople.length > 0);
  const peopleToNotShow = $derived([...selectedPeople, person]);
  const visiblePeople = $derived.by(() => {
    const source = searchName ? searchedPeople : people;
    return source.filter((person) => !peopleToNotShow.some((hiddenPerson) => hiddenPerson.id === person.id));
  });

  const loadMergePeople = async (sortFaces = false) => {
    try {
      people = await loadPeople(sortFaces, person);
    } catch (error) {
      handleError(error, loadErrorMessage ?? $t('errors.cant_search_people'));
    }
  };

  const handleSearch = async () => {
    const name = searchName.trim().toLowerCase();
    if (!name) {
      searchedPeople = [];
      return;
    }

    if (!searchPeople) {
      searchedPeople = people.filter((person) => getDisplayName(person).toLowerCase().includes(name));
      return;
    }

    showLoadingSpinner = true;
    try {
      searchedPeople = await searchPeople(searchName);
    } catch (error) {
      handleError(error, $t('errors.cant_search_people'));
    } finally {
      showLoadingSpinner = false;
    }
  };

  const handleSwapPeople = async (notify = true) => {
    [person, selectedPeople[0]] = [selectedPeople[0], person];
    if (notify) {
      await onSwapPerson(person);
    }
  };

  const onSelect = async (selected: T) => {
    if (selectedPeople.includes(selected)) {
      selectedPeople = selectedPeople.filter((person) => person.id !== selected.id);
      return;
    }

    if (selectedPeople.length >= mergeLimit) {
      toastManager.warning($t('merge_people_limit'));
      return;
    }

    selectedPeople = [selected, ...selectedPeople];

    if (selectedPeople.length === 1 && !getDisplayName(person) && getDisplayName(selected)) {
      await handleSwapPeople(false);
    }
  };

  const handleMerge = async () => {
    const isConfirm = await modalManager.showDialog({ prompt: $t('merge_people_prompt') });
    if (!isConfirm) {
      return;
    }

    try {
      const mergedPerson = await mergePeople(person, selectedPeople);
      onMerge(mergedPerson ?? person);
    } catch (error) {
      handleError(error, mergeErrorMessage ?? $t('cannot_merge_people'));
    }
  };

  onMount(() => {
    void loadMergePeople();
  });
</script>

<svelte:window bind:innerHeight={screenHeight} />

<section
  transition:fly={{ y: 500, duration: 100, easing: quintOut }}
  class="fixed start-0 top-0 z-50 h-full w-full bg-light dark:bg-immich-dark-bg"
>
  <ControlAppBar onClose={onBack}>
    {#snippet leading()}
      {#if hasSelection}
        {$t('selected_count', { values: { count: selectedPeople.length } })}
      {:else}
        {$t('merge_people')}
      {/if}
      <div></div>
    {/snippet}
    {#snippet trailing()}
      <Button leadingIcon={mdiMerge} size="small" shape="round" disabled={!hasSelection} onclick={handleMerge}>
        {$t('merge')}
      </Button>
    {/snippet}
  </ControlAppBar>

  <section class="px-6 pt-25 md:px-17.5">
    <section id="merge-face-selector">
      <div class="mb-10 h-50 place-content-center place-items-center">
        <p class="mb-4 text-center uppercase dark:text-white">{$t('choose_matching_people_to_merge')}</p>

        <div class="grid grid-flow-col-dense place-content-center place-items-center gap-4">
          {#each selectedPeople as selectedPerson (selectedPerson.id)}
            <div animate:flip={{ duration: 250, easing: quintOut }}>
              <button
                type="button"
                class="relative size-30 rounded-full transition-all"
                aria-label={getDisplayName(selectedPerson)}
                onclick={() => onSelect(selectedPerson)}
              >
                <div
                  class="h-full w-full rounded-full border-2 border-immich-primary brightness-90 filter dark:border-immich-dark-primary"
                >
                  <ImageThumbnail
                    circle
                    url={getThumbnailUrl(selectedPerson)}
                    altText={getDisplayName(selectedPerson)}
                    widthStyle="100%"
                    shadow
                  />
                </div>
                {#if getDisplayName(selectedPerson)}
                  <span
                    class="text-white-shadow absolute bottom-2 start-0 w-full text-ellipsis px-1 text-center font-medium text-white"
                  >
                    {getDisplayName(selectedPerson)}
                  </span>
                {/if}
              </button>
            </div>
          {/each}

          {#if hasSelection}
            <div class="relative h-full">
              <div class="flex h-full flex-col justify-between">
                <div class="flex h-full items-center justify-center">
                  <Icon icon={mdiCallMerge} size="48" class="rotate-90 dark:text-white" />
                </div>
                {#if selectedPeople.length === 1}
                  <div class="absolute bottom-2">
                    <IconButton
                      shape="round"
                      color="secondary"
                      variant="ghost"
                      aria-label={$t('swap_merge_direction')}
                      icon={mdiSwapHorizontal}
                      size="large"
                      onclick={() => handleSwapPeople()}
                    />
                  </div>
                {/if}
              </div>
            </div>
          {/if}

          <button
            type="button"
            class="relative size-45 rounded-full transition-all"
            disabled
            aria-label={getDisplayName(person)}
          >
            <div
              class="h-full w-full rounded-full border-2 border-immich-primary brightness-90 filter dark:border-immich-dark-primary"
            >
              <ImageThumbnail
                circle
                url={getThumbnailUrl(person)}
                altText={getDisplayName(person)}
                widthStyle="100%"
                shadow
              />
            </div>
            {#if getDisplayName(person)}
              <span
                class="text-white-shadow absolute bottom-2 start-0 w-full text-ellipsis px-1 text-center font-medium text-white"
              >
                {getDisplayName(person)}
              </span>
            {/if}
          </button>
        </div>
      </div>

      <div class="flex h-14 w-40 place-items-center gap-4 sm:w-48 md:w-full">
        <div class="md:w-96">
          <SearchBar
            bind:name={searchName}
            {showLoadingSpinner}
            placeholder={$t('search_people')}
            onReset={() => (searchedPeople = [])}
            onSearch={() => void handleSearch()}
          />
        </div>

        {#if showSimilaritySort}
          <IconButton
            shape="round"
            color="secondary"
            variant="ghost"
            icon={mdiSwapVertical}
            onclick={() => {
              sortBySimilarity = !sortBySimilarity;
              void loadMergePeople(sortBySimilarity);
            }}
            aria-label={$t('sort_people_by_similarity')}
          />
        {/if}
      </div>

      <div
        class="immich-scrollbar mt-6 overflow-y-auto rounded-3xl bg-gray-200 p-10 dark:bg-immich-dark-gray"
        style:max-height={Math.max(screenHeight - 400, 200) + 'px'}
      >
        <div class="grid-col-2 grid gap-8 md:grid-cols-3 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10">
          {#each visiblePeople as mergePerson (mergePerson.id)}
            <button
              type="button"
              class="relative rounded-lg transition-all"
              aria-label={getDisplayName(mergePerson)}
              onclick={() => onSelect(mergePerson)}
            >
              <div
                class="h-full w-full rounded-full border-2 border-immich-primary brightness-90 filter dark:border-immich-dark-primary"
              >
                <ImageThumbnail
                  circle
                  url={getThumbnailUrl(mergePerson)}
                  altText={getDisplayName(mergePerson)}
                  widthStyle="100%"
                  shadow
                />
              </div>
              <div
                class="absolute start-0 top-0 h-full w-full rounded-full bg-immich-primary/30 opacity-0 hover:opacity-100"
              ></div>
              {#if getDisplayName(mergePerson)}
                <span
                  class="text-white-shadow absolute bottom-2 start-0 w-full text-ellipsis px-1 text-center font-medium text-white"
                >
                  {getDisplayName(mergePerson)}
                </span>
              {/if}
            </button>
          {/each}
        </div>
      </div>
    </section>
  </section>
</section>
