<script lang="ts" context="module">
</script>

<script lang="ts">
  import { blur, fly } from 'svelte/transition';
  import { linear } from 'svelte/easing';
  import { api, type PersonResponseDto, AssetFaceResponseDto } from '@api';
  import ImageThumbnail from '../assets/thumbnail/image-thumbnail.svelte';
  import { cloneDeep } from 'lodash-es';
  import { handleError } from '$lib/utils/handle-error';
  import { createEventDispatcher, onMount } from 'svelte';

  import LoadingSpinner from '$lib/components/shared-components/loading-spinner.svelte';
  import { NotificationType, notificationController } from '../shared-components/notification/notification';
  import { mdiArrowLeftThin, mdiClose, mdiMagnify, mdiPlus, mdiRestart } from '@mdi/js';
  import Icon from '../elements/icon.svelte';
  import { assetDataUrl, imageDiv } from '$lib/stores/assets.store';

  let people: AssetFaceResponseDto[] = [];

  export let assetId: string;
  export let createdPeople: (string | null)[];
  export let people2: PersonResponseDto[];

  let createdPeopleClone = cloneDeep(createdPeople);

  let searchedPeople: PersonResponseDto[] = [];
  let searchWord: string;

  const dispatch = createEventDispatcher();

  let searchFaces = false;
  let searchName = '';

  let allPeople: PersonResponseDto[] = [];
  let editedPerson: number;
  let selectedPersonToReassign: (PersonResponseDto | null)[] = new Array<PersonResponseDto | null>(people.length);
  let selectedPersonToCreate: (string | null)[] = new Array<string | null>(people.length);

  let showSeletecFaces = false;
  let showLoadingSpinner = false;

  let editedPeople: AssetFaceResponseDto[] = [];
  let isSearchingPeople = false;
  let isCreatingPerson = false;
  let isShowLoadingPeople = false;

  onMount(async () => {
    const timeout = setTimeout(() => (isShowLoadingPeople = true), 100);
    try {
      const { data } = await api.personApi.getAllPeople({ withHidden: true });
      allPeople = data.people;
      const result = await api.personApi.getFaces({ id: assetId });
      people = result.data;
      editedPeople = cloneDeep(people);
      clearTimeout(timeout);
    } catch (error) {
      people = [];
      handleError(error, "Can't get faces");
    }
  });

  const cleanBoundingBox = () => {
    let boundingBox = document.getElementById('boundingbox');
    if (boundingBox) $imageDiv.removeChild(boundingBox);
  };

  function getContainedSize(img: HTMLImageElement) {
    var ratio = img.naturalWidth / img.naturalHeight;
    var width = img.height * ratio;
    var height = img.height;
    if (width > img.width) {
      width = img.width;
      height = img.width / ratio;
    }
    return { width, height };
  }

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

  const showBoundingBox = (index: number) => {
    cleanBoundingBox();
    let x = 0;
    let y = 0;
    let clientHeight = 0;
    let clientWidth = 0;
    const image: HTMLImageElement = document.getElementById('img') as HTMLImageElement;

    if (image) {
      clientHeight = image.clientHeight;
      clientWidth = image.clientWidth;

      const { width, height } = getContainedSize(image);
      x = width;
      y = height;
    }

    let absoluteDiv = document.createElement('div');

    // Add a class to the new div for styling
    absoluteDiv.classList.add('absoluteDiv');
    absoluteDiv.id = 'boundingbox';

    let coordinates = {
      x1: (x / people[index].imageWidth) * people[index].boundingBoxX1 + (clientWidth - x) / 2,
      x2: (x / people[index].imageWidth) * people[index].boundingBoxX2 + (clientWidth - x) / 2,
      y1: (y / people[index].imageHeight) * people[index].boundingBoxY1 + (clientHeight - y) / 2,
      y2: (y / people[index].imageHeight) * people[index].boundingBoxY2 + (clientHeight - y) / 2,
    };

    absoluteDiv.style.setProperty('position', 'absolute');
    absoluteDiv.style.setProperty('top', coordinates.y1 + 'px');
    absoluteDiv.style.setProperty('left', coordinates.x1 + 'px');
    absoluteDiv.style.setProperty('width', coordinates.x2 - coordinates.x1 + 'px');
    absoluteDiv.style.setProperty('height', coordinates.y2 - coordinates.y1 + 'px');
    absoluteDiv.style.setProperty('border-color', 'rgb(255 255 255)');
    absoluteDiv.style.setProperty('border-width', '2px');
    absoluteDiv.style.setProperty('border-radius', '0.75rem');
    $imageDiv.appendChild(absoluteDiv);
  };

  function initInput(element: HTMLInputElement) {
    element.focus();
  }

  const handleBackButton = () => {
    cleanBoundingBox();
    searchName = '';
    searchFaces = false;
    selectedPersonToCreate = new Array<string | null>(people.length);
    if (showSeletecFaces) {
      showSeletecFaces = false;
    } else {
      dispatch('close');
    }
  };

  async function zoomImageToBase64(
    imageSrc: string,
    x1: number,
    x2: number,
    y1: number,
    y2: number,
  ): Promise<string | null> {
    const width = x2 - x1;
    const height = y2 - y1;

    const img = new Image();
    img.src = imageSrc;

    await new Promise((resolve) => {
      img.onload = resolve;
      img.onerror = () => resolve(null);
    });

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(img, x1 - (width - width) / 2, y1 - (height - height) / 2, width, height, 0, 0, width, height);

      // Convert the canvas content to base64
      const base64Image = canvas.toDataURL();
      return base64Image;
    } else {
      return null;
    }
  }

  const handleReset = (index: number) => {
    editedPeople[index] = cloneDeep(people[index]);
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
        for (let i = 0; i < selectedPersonToReassign.length; i++) {
          const personId = selectedPersonToReassign[i]?.id;
          const personId2 = people[i].person?.id;
          if (personId && personId2) {
            await api.personApi.reassignFaces({
              id: personId,
              assetFaceUpdateDto: { data: [{ assetFaceId: people[i].id }] },
            });
            people2[i] = selectedPersonToReassign[i] as PersonResponseDto;
          }
        }
        for (let i = 0; i < selectedPersonToCreate.length; i++) {
          const personToCreate = selectedPersonToCreate[i];
          if (personToCreate) {
            const { data } = await api.personApi.createPerson({
              assetFaceUpdateDto: { data: [{ assetFaceId: people[i].id }] },
            });
            people[i].person = data;
            people2[i] = data;

            selectedPersonToCreate[i] = personToCreate;
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
    for (let i = 0; i < people.length; i++) {
      if (people[i].id === people[editedPerson].id) {
        const newFeaturePhoto = await zoomImageToBase64(
          $assetDataUrl,
          people[i].boundingBoxX1,
          people[i].boundingBoxX2,
          people[i].boundingBoxY1,
          people[i].boundingBoxY2,
        );

        if (newFeaturePhoto) {
          selectedPersonToCreate[i] = newFeaturePhoto;
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
                on:focus={() => showBoundingBox(index)}
                on:mouseover={() => showBoundingBox(index)}
                on:mouseleave={() => cleanBoundingBox()}
              >
                <ImageThumbnail
                  curve
                  shadow
                  url={createdPeopleClone[index] ||
                    selectedPersonToCreate[index] ||
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
        <div class="w-full flex ">
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
            <LoadingSpinner/>
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
            {#if person.id !== people[editedPerson].person?.id}
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
            {#if person.id !== people[editedPerson].person?.id}
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
