<script lang="ts" context="module">
  export type PersonToCreate = {
    thumbnail: string;
    id: string;
  };
</script>

<script lang="ts">
  import { blur, fly } from 'svelte/transition';
  import { linear } from 'svelte/easing';
  import { api, type PersonResponseDto, AssetFaceResponseDto, PersonWithFacesResponseDto } from '@api';
  import ImageThumbnail from '../assets/thumbnail/image-thumbnail.svelte';
  import { cloneDeep } from 'lodash-es';
  import { handleError } from '$lib/utils/handle-error';
  import { createEventDispatcher, onMount } from 'svelte';

  import LoadingSpinner from '$lib/components/shared-components/loading-spinner.svelte';
  import { NotificationType, notificationController } from '../shared-components/notification/notification';
  import { mdiArrowLeftThin, mdiClose, mdiMagnify, mdiPlus, mdiRestart } from '@mdi/js';
  import Icon from '../elements/icon.svelte';
  import { imageDiv, photoViewerId } from '$lib/stores/assets.store';
  import { cleanBoundingBox, showBoundingBox } from '$lib/utils/people-utils';
  import { photoZoomState } from '$lib/stores/zoom-image.store';
  import { setBoundingBoxesArray } from '$lib/stores/people.store';

  export let assetId: string;
  export let createdPeople: (PersonToCreate | null)[];
  export let people: PersonWithFacesResponseDto[];

  let peopleWithFaces: AssetFaceResponseDto[] = [];
  let createdPeopleClone: (PersonToCreate | null)[];
  let searchedPeople: PersonResponseDto[] = [];
  let searchWord: string;

  let searchFaces = false;
  let searchName = '';

  let allPeople: PersonResponseDto[] = [];
  let editedPerson: number;
  let selectedPersonToReassign: (PersonResponseDto | null)[];
  let selectedPersonToCreate: (PersonToCreate | null)[];

  let showSeletecFaces = false;
  let showLoadingSpinner = false;

  let editedPeople: AssetFaceResponseDto[] = [];
  let isSearchingPeople = false;
  let isCreatingPerson = false;
  let isShowLoadingPeople = false;

  const dispatch = createEventDispatcher();

  onMount(async () => {
    const timeout = setTimeout(() => (isShowLoadingPeople = true), 100);
    try {
      const { data } = await api.personApi.getAllPeople({ withHidden: true });
      allPeople = data.people;
      const result = await api.personApi.getFaces({ id: assetId });
      peopleWithFaces = result.data;
      selectedPersonToCreate = new Array<PersonToCreate | null>(peopleWithFaces.length);
      selectedPersonToReassign = new Array<PersonResponseDto | null>(peopleWithFaces.length);
      editedPeople = cloneDeep(peopleWithFaces);

      createdPeople = peopleWithFaces.map((face) => createdPeople.find((person) => person?.id === face.id) ?? null);
      createdPeopleClone = cloneDeep(createdPeople);
      clearTimeout(timeout);
    } catch (error) {
      handleError(error, "Can't get faces");
    }
  });

  const searchPeople = async () => {
    if ((searchedPeople.length < 20 && searchName.startsWith(searchWord)) || searchName === '') {
      return;
    }
    const timeout = setTimeout(() => (isSearchingPeople = true), 100);
    try {
      const { data } = await api.searchApi.searchPerson({ name: searchName });
      searchedPeople = data;
      searchWord = searchName;
    } catch (error) {
      handleError(error, "Can't search people");
    } finally {
      clearTimeout(timeout);
    }

    isSearchingPeople = false;
  };

  const handleCleanBoundingBox = () => {
    setBoundingBoxesArray([]);
    cleanBoundingBox();
  };

  const handleShowBoundingBox = (index: number) => {
    setBoundingBoxesArray(people[index].faces);
    const [result] = showBoundingBox([peopleWithFaces[index]], $photoZoomState);
    $imageDiv.appendChild(result);
  };

  function initInput(element: HTMLInputElement) {
    element.focus();
  }

  const handleBackButton = () => {
    cleanBoundingBox();
    searchName = '';
    searchFaces = false;
    selectedPersonToCreate = new Array<PersonToCreate | null>(peopleWithFaces.length);
    if (showSeletecFaces) {
      showSeletecFaces = false;
    } else {
      dispatch('close');
    }
  };

  const zoomImageToBase64 = async (face: AssetFaceResponseDto): Promise<string | null> => {
    const image: HTMLImageElement | null = document.getElementById(photoViewerId) as HTMLImageElement | null;
    if (image === null) {
      return null;
    }

    const naturalHeight = image.naturalHeight;
    const naturalWidth = image.naturalWidth;
    const { boundingBoxX1: x1, boundingBoxX2: x2, boundingBoxY1: y1, boundingBoxY2: y2 } = face;

    const coordinates = {
      x1: (naturalWidth / face.imageWidth) * x1,
      x2: (naturalWidth / face.imageWidth) * x2,
      y1: (naturalHeight / face.imageHeight) * y1,
      y2: (naturalHeight / face.imageHeight) * y2,
    };

    const faceWidth = coordinates.x2 - coordinates.x1;
    const faceHeight = coordinates.y2 - coordinates.y1;

    const faceImage = new Image();
    faceImage.src = image.src;

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
    editedPeople[index] = cloneDeep(peopleWithFaces[index]);
    if (createdPeople[index]) {
      createdPeopleClone[index] = createdPeople[index];
    }
    if (selectedPersonToReassign[index]) {
      selectedPersonToReassign[index] = null;
    }
    if (selectedPersonToCreate[index]) {
      selectedPersonToCreate[index] = null;
    }
  };

  const handleEditFaces = async () => {
    const numberOfChanges =
      selectedPersonToCreate.filter((person) => person !== null).length +
      selectedPersonToReassign.filter((person) => person !== null).length;
    if (numberOfChanges > 0) {
      try {
        for (let i = 0; i < peopleWithFaces.length; i++) {
          const personId = selectedPersonToReassign[i]?.id;

          if (personId) {
            const { data } = await api.personApi.reassignFaces({
              id: personId,
              assetFaceUpdateDto: { data: [{ assetFaceId: peopleWithFaces[i].id }] },
            });
            const indexToUpdate = people.findIndex((person) => person.id === data[0].id);
            if (indexToUpdate !== -1) {
              people[indexToUpdate].faces.push(peopleWithFaces[i]);
            } else {
              people.push({ ...data[0], faces: [peopleWithFaces[i]] });
            }
          } else if (selectedPersonToCreate[i]) {
            const { data } = await api.personApi.createPerson({
              assetFaceUpdateDto: { data: [{ assetFaceId: peopleWithFaces[i].id }] },
            });
            peopleWithFaces[i].person = data;
            people.push({ ...data, faces: [peopleWithFaces[i]] });
            selectedPersonToCreate = selectedPersonToCreate.splice(i, 1);
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
    createdPeople = selectedPersonToCreate;
    dispatch('close');
  };

  const handleCreatePerson = async () => {
    const timeout = setTimeout(() => (isCreatingPerson = true), 100);
    for (let i = 0; i < peopleWithFaces.length; i++) {
      if (peopleWithFaces[i].id === peopleWithFaces[editedPerson].id) {
        const newFeaturePhoto = await zoomImageToBase64(peopleWithFaces[i]);

        if (newFeaturePhoto) {
          selectedPersonToCreate[i] = { thumbnail: newFeaturePhoto, id: peopleWithFaces[i].id };
        }
        createdPeopleClone[i] = null;
        break;
      }
    }
    clearTimeout(timeout);
    showSeletecFaces = false;
  };

  const handleReassignFace = (person: PersonResponseDto | null) => {
    if (person) {
      selectedPersonToReassign[editedPerson] = person;
      editedPeople[editedPerson].person = person;
      createdPeopleClone[editedPerson] = null;
      showSeletecFaces = false;
    }
  };

  const handlePersonPicker = async (index: number) => {
    editedPerson = index;
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
    {#if !showLoadingSpinner}
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
        {#each editedPeople as person, index}
          {#if person.person}
            <div class="relative z-[20001] h-[115px] w-[95px]">
              <div
                role="button"
                tabindex={index}
                class="absolute left-0 top-0 h-[90px] w-[90px] cursor-default"
                on:focus={() => handleShowBoundingBox(index)}
                on:mouseover={() => handleShowBoundingBox(index)}
                on:mouseleave={() => handleCleanBoundingBox()}
              >
                <ImageThumbnail
                  curve
                  shadow
                  url={createdPeopleClone[index]?.thumbnail ||
                    selectedPersonToCreate[index]?.thumbnail ||
                    api.getPeopleThumbnailUrl(person.person.id)}
                  altText={person.person?.name || ''}
                  title={person.person?.name || ''}
                  widthStyle="90px"
                  heightStyle="90px"
                  thumbhash={null}
                />
                <p class="relative mt-1 truncate font-medium" title={person.person?.name}>
                  {person.person?.name}
                </p>
              </div>

              <div
                transition:blur={{ amount: 10, duration: 50 }}
                class="absolute -right-[5px] -top-[5px] h-[20px] w-[20px] rounded-full bg-blue-700"
              >
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
          {#if !isCreatingPerson}
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
          {#if isSearchingPeople}
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
            {#if person.id !== peopleWithFaces[editedPerson].person?.id}
              <div class="w-fit">
                <button class="w-[90px]" on:click={() => handleReassignFace(person)}>
                  <ImageThumbnail
                    curve
                    shadow
                    url={api.getPeopleThumbnailUrl(person.id)}
                    altText={person.name}
                    title={person.name}
                    widthStyle="90px"
                    heightStyle="90px"
                    thumbhash={null}
                  />

                  <p class="mt-1 truncate font-medium" title={person.name}>{person.name}</p>
                </button>
              </div>
            {/if}
          {/each}
        {:else}
          {#each searchedPeople as person (person.id)}
            {#if person.id !== peopleWithFaces[editedPerson].person?.id}
              <div class="w-fit">
                <button class="w-[90px]" on:click={() => handleReassignFace(person)}>
                  <ImageThumbnail
                    curve
                    shadow
                    url={api.getPeopleThumbnailUrl(person.id)}
                    altText={person.name}
                    title={person.name}
                    widthStyle="90px"
                    heightStyle="90px"
                    thumbhash={null}
                  />

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
