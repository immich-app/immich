<script lang="ts">
  import { api, AssetTypeEnum, type AssetFaceResponseDto, type PersonResponseDto, ThumbnailFormat } from '@api';
  import { createEventDispatcher } from 'svelte';
  import { linear } from 'svelte/easing';
  import { fly } from 'svelte/transition';
  import Icon from '../elements/icon.svelte';
  import { mdiArrowLeftThin, mdiClose, mdiMagnify, mdiPlus } from '@mdi/js';
  import LoadingSpinner from '../shared-components/loading-spinner.svelte';
  import ImageThumbnail from '../assets/thumbnail/image-thumbnail.svelte';
  import { getPersonNameWithHiddenValue, searchNameLocal } from '$lib/utils/person';
  import { handleError } from '$lib/utils/handle-error';
  import { photoViewer } from '$lib/stores/assets.store';
  import { maximumLengthSearchPeople, timeBeforeShowLoadingSpinner } from '$lib/constants';

  export let peopleWithFaces: AssetFaceResponseDto[];
  export let allPeople: PersonResponseDto[];
  export let editedPersonIndex: number;
  export let assetType: AssetTypeEnum;
  export let assetId: string;

  // loading spinners
  let isShowLoadingNewPerson = false;
  let isShowLoadingSearch = false;

  // search people
  let searchedPeople: PersonResponseDto[] = [];
  let searchedPeopleCopy: PersonResponseDto[] = [];
  let searchWord: string;
  let searchFaces = false;
  let searchName = '';

  const dispatch = createEventDispatcher<{
    close: void;
    createPerson: string | null;
    reassign: PersonResponseDto;
  }>();
  const handleBackButton = () => {
    dispatch('close');
  };
  const zoomImageToBase64 = async (face: AssetFaceResponseDto): Promise<string | null> => {
    let image: HTMLImageElement | null = null;
    if (assetType === AssetTypeEnum.Image) {
      image = $photoViewer;
    } else if (assetType === AssetTypeEnum.Video) {
      const data = await api.getAssetThumbnailUrl(assetId, ThumbnailFormat.Webp);
      const img: HTMLImageElement = new Image();
      img.src = data;

      await new Promise<void>((resolve) => {
        img.addEventListener('load', () => resolve());
        img.addEventListener('error', () => resolve());
      });

      image = img;
    }
    if (image === null) {
      return null;
    }
    const {
      boundingBoxX1: x1,
      boundingBoxX2: x2,
      boundingBoxY1: y1,
      boundingBoxY2: y2,
      imageWidth,
      imageHeight,
    } = face;

    const coordinates = {
      x1: (image.naturalWidth / imageWidth) * x1,
      x2: (image.naturalWidth / imageWidth) * x2,
      y1: (image.naturalHeight / imageHeight) * y1,
      y2: (image.naturalHeight / imageHeight) * y2,
    };

    const faceWidth = coordinates.x2 - coordinates.x1;
    const faceHeight = coordinates.y2 - coordinates.y1;

    const faceImage = new Image();
    faceImage.src = image.src;

    await new Promise((resolve) => {
      faceImage.addEventListener('load', resolve);
      faceImage.addEventListener('error', () => resolve(null));
    });

    const canvas = document.createElement('canvas');
    canvas.width = faceWidth;
    canvas.height = faceHeight;

    const context = canvas.getContext('2d');
    if (context) {
      context.drawImage(faceImage, coordinates.x1, coordinates.y1, faceWidth, faceHeight, 0, 0, faceWidth, faceHeight);

      return canvas.toDataURL();
    } else {
      return null;
    }
  };

  const handleCreatePerson = async () => {
    const timeout = setTimeout(() => (isShowLoadingNewPerson = true), timeBeforeShowLoadingSpinner);
    const personToUpdate = peopleWithFaces.find((person) => person.id === peopleWithFaces[editedPersonIndex].id);

    const newFeaturePhoto = personToUpdate ? await zoomImageToBase64(personToUpdate) : null;

    dispatch('createPerson', newFeaturePhoto);

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

  $: {
    searchedPeople = searchNameLocal(searchName, searchedPeopleCopy, 20);
  }

  const initInput = (element: HTMLInputElement) => {
    element.focus();
  };
</script>

<section
  transition:fly={{ x: 360, duration: 100, easing: linear }}
  class="absolute top-0 z-[2001] h-full w-[360px] overflow-x-hidden p-2 bg-immich-bg dark:bg-immich-dark-bg dark:text-immich-dark-fg"
>
  <div class="flex place-items-center justify-between gap-2">
    {#if !searchFaces}
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
            searchFaces = true;
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
        on:click={() => (searchFaces = false)}
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
          {#if person.id !== peopleWithFaces[editedPersonIndex].person?.id}
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
          {#if person.id !== peopleWithFaces[editedPersonIndex].person?.id}
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
          {/if}
        {/each}
      {/if}
    </div>
  </div>
</section>
