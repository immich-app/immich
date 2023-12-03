<script lang="ts">
  import { fly } from 'svelte/transition';
  import { linear } from 'svelte/easing';
  import { api, type PersonResponseDto, AssetFaceResponseDto } from '@api';
  import ImageThumbnail from '../assets/thumbnail/image-thumbnail.svelte';
  import { handleError } from '$lib/utils/handle-error';
  import { createEventDispatcher, onMount } from 'svelte';

  import LoadingSpinner from '$lib/components/shared-components/loading-spinner.svelte';
  import { NotificationType, notificationController } from '../shared-components/notification/notification';
  import { mdiArrowLeftThin, mdiClose, mdiMagnify, mdiPlus, mdiRestart } from '@mdi/js';
  import Icon from '../elements/icon.svelte';
  import { photoViewer } from '$lib/stores/assets.store';
  import { setBoundingBoxesArray } from '$lib/stores/people.store';
  import { websocketStore } from '$lib/stores/websocket';

  export let assetId: string;

  // keep track of the changes
  let numberOfPersonToCreate: string[] = [];
  let numberOfAssetFaceGenerated: string[] = [];

  // faces
  let peopleWithFaces: AssetFaceResponseDto[] = [];
  let selectedPersonToReassign: (PersonResponseDto | null)[];
  let selectedPersonToCreate: (string | null)[];

  // loading spinners
  let isShowLoadingDone = false;
  let isShowLoadingNewPerson = false;
  let isShowLoadingPeople = false;
  let isShowLoadingSearch = false;

  // search people
  let editedPersonIndex: number;
  let showSeletecFaces = false;
  let searchedPeople: PersonResponseDto[] = [];
  let searchWord: string;
  let searchFaces = false;
  let searchName = '';
  let allPeople: PersonResponseDto[] = [];

  // timers
  let loaderLoadingDoneTimeout: NodeJS.Timeout;
  let automaticRefreshTimeout: NodeJS.Timeout;

  const { onPersonThumbnail } = websocketStore;
  const dispatch = createEventDispatcher();

  // Reset value
  $onPersonThumbnail = '';

  $: {
    if ($onPersonThumbnail) {
      numberOfAssetFaceGenerated.push($onPersonThumbnail);
      if (
        isEqual(numberOfAssetFaceGenerated, numberOfPersonToCreate) &&
        loaderLoadingDoneTimeout &&
        automaticRefreshTimeout &&
        selectedPersonToCreate.filter((person) => person !== null).length === numberOfPersonToCreate.length
      ) {
        clearTimeout(loaderLoadingDoneTimeout);
        clearTimeout(automaticRefreshTimeout);
        dispatch('refresh');
      }
    }
  }

  onMount(async () => {
    const timeout = setTimeout(() => (isShowLoadingPeople = true), 100);
    try {
      const { data } = await api.personApi.getAllPeople({ withHidden: true });
      allPeople = data.people;
      const result = await api.faceApi.getFaces({ id: assetId });
      peopleWithFaces = result.data;
      selectedPersonToCreate = new Array<string | null>(peopleWithFaces.length);
      selectedPersonToReassign = new Array<PersonResponseDto | null>(peopleWithFaces.length);
    } catch (error) {
      handleError(error, "Can't get faces");
    } finally {
      clearTimeout(timeout);
    }
    isShowLoadingPeople = false;
  });

  const getPersonNameWithHiddenValue = (name: string, isHidden: boolean) => {
    return `${name} ${isHidden ? '(hidden)' : ''}`;
  };

  const isEqual = (a: string[], b: string[]): boolean => {
    return b.every((valueB) => a.includes(valueB));
  };

  const searchPeople = async () => {
    if ((searchedPeople.length < 20 && searchName.startsWith(searchWord)) || searchName === '') {
      return;
    }
    const timeout = setTimeout(() => (isShowLoadingSearch = true), 100);
    try {
      const { data } = await api.searchApi.searchPerson({ name: searchName });
      searchedPeople = data;
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

  const handleBackButton = () => {
    searchName = '';
    searchFaces = false;
    if (showSeletecFaces) {
      showSeletecFaces = false;
    } else {
      dispatch('close');
    }
  };

  const zoomImageToBase64 = async (face: AssetFaceResponseDto): Promise<string | null> => {
    if ($photoViewer === null) {
      return null;
    }
    const { boundingBoxX1: x1, boundingBoxX2: x2, boundingBoxY1: y1, boundingBoxY2: y2 } = face;

    const coordinates = {
      x1: ($photoViewer.naturalWidth / face.imageWidth) * x1,
      x2: ($photoViewer.naturalWidth / face.imageWidth) * x2,
      y1: ($photoViewer.naturalHeight / face.imageHeight) * y1,
      y2: ($photoViewer.naturalHeight / face.imageHeight) * y2,
    };

    const faceWidth = coordinates.x2 - coordinates.x1;
    const faceHeight = coordinates.y2 - coordinates.y1;

    const faceImage = new Image();
    faceImage.src = $photoViewer.src;

    await new Promise((resolve) => {
      faceImage.onload = resolve;
      faceImage.onerror = () => resolve(null);
    });

    const canvas = document.createElement('canvas');
    canvas.width = faceWidth;
    canvas.height = faceHeight;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(faceImage, coordinates.x1, coordinates.y1, faceWidth, faceHeight, 0, 0, faceWidth, faceHeight);

      return canvas.toDataURL();
    } else {
      return null;
    }
  };

  const handleReset = (index: number) => {
    if (selectedPersonToReassign[index]) {
      selectedPersonToReassign[index] = null;
    }
    if (selectedPersonToCreate[index]) {
      selectedPersonToCreate[index] = null;
    }
  };

  const handleEditFaces = async () => {
    loaderLoadingDoneTimeout = setTimeout(() => (isShowLoadingDone = true), 100);
    const numberOfChanges =
      selectedPersonToCreate.filter((person) => person !== null).length +
      selectedPersonToReassign.filter((person) => person !== null).length;
    if (numberOfChanges > 0) {
      try {
        for (let i = 0; i < peopleWithFaces.length; i++) {
          const personId = selectedPersonToReassign[i]?.id;

          if (personId) {
            await api.faceApi.reassignFacesById({
              id: personId,
              faceDto: { id: peopleWithFaces[i].id },
            });
          } else if (selectedPersonToCreate[i]) {
            const { data } = await api.personApi.createPerson();
            numberOfPersonToCreate.push(data.id);
            await api.faceApi.reassignFacesById({
              id: data.id,
              faceDto: { id: peopleWithFaces[i].id },
            });
          }
        }

        notificationController.show({
          message: `Edited ${numberOfChanges} ${numberOfChanges > 1 ? 'people' : 'person'}`,
          type: NotificationType.Info,
        });
      } catch (error) {
        handleError(error, "Can't apply changes");
      }
    }

    isShowLoadingDone = false;
    if (numberOfPersonToCreate.length === 0) {
      clearTimeout(loaderLoadingDoneTimeout);
      dispatch('refresh');
    } else {
      automaticRefreshTimeout = setTimeout(() => dispatch('refresh'), 15000);
    }
  };

  const handleCreatePerson = async () => {
    const timeout = setTimeout(() => (isShowLoadingNewPerson = true), 100);
    const personToUpdate = peopleWithFaces.find((person) => person.id === peopleWithFaces[editedPersonIndex].id);

    if (personToUpdate) {
      const newFeaturePhoto = await zoomImageToBase64(personToUpdate);

      if (newFeaturePhoto) {
        selectedPersonToCreate[peopleWithFaces.indexOf(personToUpdate)] = newFeaturePhoto;
      }
    }
    clearTimeout(timeout);
    isShowLoadingNewPerson = false;
    showSeletecFaces = false;
  };

  const handleReassignFace = (person: PersonResponseDto | null) => {
    if (person) {
      selectedPersonToReassign[editedPersonIndex] = person;
      showSeletecFaces = false;
    }
  };

  const handlePersonPicker = async (index: number) => {
    editedPersonIndex = index;
    showSeletecFaces = true;
  };
</script>

<section
  transition:fly={{ x: 360, duration: 100, easing: linear }}
  class="absolute top-0 z-[2000] h-full w-[360px] overflow-x-hidden p-2 dark:bg-immich-dark-bg dark:text-immich-dark-fg"
>
  <div class="flex place-items-center justify-between gap-2">
    <div class="flex items-center gap-2">
      <button
        class="flex place-content-center rounded-full p-3 transition-colors hover:bg-gray-200 dark:text-immich-dark-fg dark:hover:bg-gray-900"
        on:click={handleBackButton}
      >
        <div>
          <Icon path={mdiArrowLeftThin} size="24" />
        </div>
      </button>
      <p class="flex text-lg text-immich-fg dark:text-immich-dark-fg">Edit faces</p>
    </div>
    {#if !isShowLoadingDone}
      <button
        class="justify-self-end rounded-lg p-2 hover:bg-immich-dark-primary hover:dark:bg-immich-dark-primary/50"
        on:click={() => handleEditFaces()}
      >
        Done
      </button>
    {:else}
      <LoadingSpinner />
    {/if}
  </div>

  <div class="px-4 py-4 text-sm">
    <div class="mt-4 flex flex-wrap gap-2">
      {#if isShowLoadingPeople}
        <div class="flex w-full justify-center">
          <LoadingSpinner />
        </div>
      {:else}
        {#each peopleWithFaces as face, index}
          {#if face.person}
            <div class="relative z-[20001] h-[115px] w-[95px]">
              <div
                role="button"
                tabindex={index}
                class="absolute left-0 top-0 h-[90px] w-[90px] cursor-default"
                on:focus={() => setBoundingBoxesArray([peopleWithFaces[index]])}
                on:mouseover={() => setBoundingBoxesArray([peopleWithFaces[index]])}
                on:mouseleave={() => setBoundingBoxesArray([])}
              >
                <div class="relative">
                  <ImageThumbnail
                    curve
                    shadow
                    url={selectedPersonToCreate[index] ||
                      api.getPeopleThumbnailUrl(selectedPersonToReassign[index]?.id || face.person.id)}
                    altText={getPersonNameWithHiddenValue(face.person?.name, face.person?.isHidden)}
                    title={getPersonNameWithHiddenValue(face.person?.name, face.person?.isHidden)}
                    widthStyle="90px"
                    heightStyle="90px"
                    thumbhash={null}
                    hidden={face.person.isHidden}
                  />
                </div>
                {#if !selectedPersonToCreate[index]}
                  <p class="relative mt-1 truncate font-medium" title={face.person?.name}>
                    {#if selectedPersonToReassign[index]?.id}
                      {selectedPersonToReassign[index]?.name}
                    {:else}
                      {face.person?.name}
                    {/if}
                  </p>
                {/if}

                <div class="absolute -right-[5px] -top-[5px] h-[20px] w-[20px] rounded-full bg-blue-700">
                  {#if selectedPersonToCreate[index] || selectedPersonToReassign[index]}
                    <button on:click={() => handleReset(index)} class="flex h-full w-full">
                      <div class="absolute left-1/2 top-1/2 translate-x-[-50%] translate-y-[-50%] transform">
                        <div>
                          <Icon path={mdiRestart} size={18} />
                        </div>
                      </div>
                    </button>
                  {:else}
                    <button on:click={() => handlePersonPicker(index)} class="flex h-full w-full">
                      <div
                        class="absolute left-1/2 top-1/2 h-[2px] w-[14px] translate-x-[-50%] translate-y-[-50%] transform bg-white"
                      />
                    </button>
                  {/if}
                </div>
              </div>
            </div>
          {/if}
        {/each}
      {/if}
    </div>
  </div>
</section>

{#if showSeletecFaces}
  <section
    transition:fly={{ x: 360, duration: 100, easing: linear }}
    class="absolute top-0 z-[2001] w-[360px] h-full overflow-x-hidden p-2 dark:bg-immich-dark-bg dark:text-immich-dark-fg"
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
              on:click={() => handleCreatePerson()}
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
                <button class="w-[90px]" on:click={() => handleReassignFace(person)}>
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

                  <p
                    class="mt-1 truncate font-medium"
                    title={getPersonNameWithHiddenValue(person.name, person.isHidden)}
                  >
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
                <button class="w-[90px]" on:click={() => handleReassignFace(person)}>
                  <div class="relative">
                    <ImageThumbnail
                      curve
                      shadow
                      url={api.getPeopleThumbnailUrl(person.id)}
                      altText={`${person.name} ${person.isHidden ? '(hidden)' : ''}`}
                      title={`${person.name} ${person.isHidden ? '(hidden)' : ''}`}
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
{/if}
