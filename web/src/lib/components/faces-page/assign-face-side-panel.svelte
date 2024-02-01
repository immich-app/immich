<script lang="ts">
  import { api, type AssetFaceResponseDto, type PersonResponseDto } from '@api';
  import { createEventDispatcher } from 'svelte';
  import { linear } from 'svelte/easing';
  import { fly } from 'svelte/transition';
  import Icon from '../elements/icon.svelte';
  import { mdiArrowLeftThin, mdiClose, mdiMagnify, mdiPlus } from '@mdi/js';
  import LoadingSpinner from '../shared-components/loading-spinner.svelte';
  import ImageThumbnail from '../assets/thumbnail/image-thumbnail.svelte';
  import { getPersonNameWithHiddenValue, searchNameLocal, zoomImageToBase64 } from '$lib/utils/person';
  import { handleError } from '$lib/utils/handle-error';
  import { currentAsset, photoViewer } from '$lib/stores/assets.store';
  import { maximumLengthSearchPeople, timeBeforeShowLoadingSpinner } from '$lib/constants';

  export let personWithFace: AssetFaceResponseDto;
  export let allPeople: PersonResponseDto[];

  // loading spinners
  let isShowLoadingNewPerson = false;
  let isShowLoadingSearch = false;

  // search people
  let searchedPeople: PersonResponseDto[] = [];
  let searchedPeopleCopy: PersonResponseDto[] = [];
  let searchWord: string;
  let isSearchingPerson = false;
  let searchName = '';

  $: {
    searchedPeople = searchedPeopleCopy.filter(
      (person) => personWithFace.person && personWithFace.person.id !== person.id,
    );

    if (searchName) {
      searchedPeople = searchNameLocal(searchName, searchedPeople, 10);
    }
  }

  const dispatch = createEventDispatcher<{
    close: void;
    createPerson: string | null;
    reassign: PersonResponseDto;
  }>();
  const handleBackButton = () => {
    dispatch('close');
  };

  const handleCreatePerson = async () => {
    if ($currentAsset === null) {
      return;
    }

    const timeout = setTimeout(() => (isShowLoadingNewPerson = true), timeBeforeShowLoadingSpinner);
    const personToUpdate = peopleWithFaces.find((person) => person.id === peopleWithFaces[editedPersonIndex].id);

    const newFeaturePhoto = await zoomImageToBase64(personWithFace, $photoViewer, $currentAsset.type, $currentAsset.id);

    clearTimeout(timeout);
    isShowLoadingNewPerson = false;
    dispatch('createPerson', newFeaturePhoto);
  };

  const searchPeople = async () => {
    if ((searchedPeople.length < maximumLengthSearchPeople && searchName.startsWith(searchWord)) || searchName === '') {
      return;
    }
    const timeout = setTimeout(() => (isShowLoadingSearch = true), timeBeforeShowLoadingSpinner);
    try {
      const { data } = await api.searchApi.searchPerson({ name: searchName });
      searchedPeople = data;
      searchedPeopleCopy = data;
      searchWord = searchName;
    } catch (error) {
      handleError(error, "Can't search people");
    } finally {
      clearTimeout(timeout);
    }

    isShowLoadingSearch = false;
  };

  const initInput = (element: HTMLInputElement) => {
    element.focus();
  };
</script>

<section
  transition:fly={{ x: 360, duration: 100, easing: linear }}
  class="absolute top-0 z-[2002] h-full w-[360px] overflow-x-hidden p-2 bg-immich-bg dark:bg-immich-dark-bg dark:text-immich-dark-fg"
>
  <div class="flex place-items-center justify-between gap-2">
    {#if !isSearchingPerson}
      <div class="flex items-center gap-2">
        <button
          class="flex place-content-center rounded-full p-3 transition-colors hover:bg-gray-200 dark:text-immich-dark-fg dark:hover:bg-gray-900"
          on:click={handleBackButton}
        >
          <div>
            <Icon path={mdiArrowLeftThin} size="24" />
          </div>
        </button>
        <p class="flex text-lg text-immich-fg dark:text-immich-dark-fg">Select face</p>
      </div>
      <div class="flex justify-end gap-2">
        <button
          class="flex place-content-center place-items-center rounded-full p-3 transition-colors hover:bg-gray-200 dark:text-immich-dark-fg dark:hover:bg-gray-900"
          title="Search existing person"
          on:click={() => {
            isSearchingPerson = true;
          }}
        >
          <div>
            <Icon path={mdiMagnify} size="24" />
          </div>
        </button>
        {#if !isShowLoadingNewPerson}
          <button
            class="flex place-content-center place-items-center rounded-full p-3 transition-colors hover:bg-gray-200 dark:text-immich-dark-fg dark:hover:bg-gray-900"
            on:click={handleCreatePerson}
            title="Create new person"
          >
            <div>
              <Icon path={mdiPlus} size="24" />
            </div>
          </button>
        {:else}
          <div class="flex place-content-center place-items-center">
            <LoadingSpinner />
          </div>
        {/if}
      </div>
    {:else}
      <button
        class="flex place-content-center rounded-full p-3 transition-colors hover:bg-gray-200 dark:text-immich-dark-fg dark:hover:bg-gray-900"
        on:click={handleBackButton}
      >
        <div>
          <Icon path={mdiArrowLeftThin} size="24" />
        </div>
      </button>
      <div class="w-full flex">
        <input
          class="w-full gap-2 bg-immich-bg dark:bg-immich-dark-bg"
          type="text"
          placeholder="Name or nickname"
          bind:value={searchName}
          on:input={searchPeople}
          use:initInput
        />
        {#if isShowLoadingSearch}
          <div>
            <LoadingSpinner />
          </div>
        {/if}
      </div>
      <button
        class="flex place-content-center place-items-center rounded-full p-3 transition-colors hover:bg-gray-200 dark:text-immich-dark-fg dark:hover:bg-gray-900"
        on:click={() => (isSearchingPerson = false)}
      >
        <div>
          <Icon path={mdiClose} size="24" />
        </div>
      </button>
    {/if}
  </div>
  <div class="px-4 py-4 text-sm">
    <h2 class="mb-8 mt-4 uppercase">All people</h2>
    <div class="immich-scrollbar mt-4 flex flex-wrap gap-2 overflow-y-auto">
      {#if searchName == ''}
        {#each allPeople as person (person.id)}
          {#if person.id !== personWithFace.person?.id}
            <div class="w-fit">
              <button class="w-[90px]" on:click={() => dispatch('reassign', person)}>
                <div class="relative">
                  <ImageThumbnail
                    curve
                    shadow
                    url={api.getPeopleThumbnailUrl(person.id)}
                    altText={getPersonNameWithHiddenValue(person.name, person.isHidden)}
                    title={getPersonNameWithHiddenValue(person.name, person.isHidden)}
                    widthStyle="90px"
                    heightStyle="90px"
                    thumbhash={null}
                    hidden={person.isHidden}
                  />
                </div>

                <p class="mt-1 truncate font-medium" title={getPersonNameWithHiddenValue(person.name, person.isHidden)}>
                  {person.name}
                </p>
              </button>
            </div>
          {/if}
        {/each}
      {:else}
        {#each searchedPeople as person (person.id)}
          <div class="w-fit">
            <button class="w-[90px]" on:click={() => dispatch('reassign', person)}>
              <div class="relative">
                <ImageThumbnail
                  curve
                  shadow
                  url={api.getPeopleThumbnailUrl(person.id)}
                  altText={getPersonNameWithHiddenValue(person.name, person.isHidden)}
                  title={getPersonNameWithHiddenValue(person.name, person.isHidden)}
                  widthStyle="90px"
                  heightStyle="90px"
                  thumbhash={null}
                  hidden={person.isHidden}
                />
              </div>
              <p class="mt-1 truncate font-medium" title={person.name}>{person.name}</p>
            </button>
          </div>
        {/each}
      {/if}
    </div>
  </div>
</section>
