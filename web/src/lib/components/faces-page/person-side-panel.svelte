<script lang="ts" context="module">
  export type PersonToCreate = {
    thumbnail: string;
    canEdit: boolean;
  };
</script>

<script lang="ts">
  import { blur, fly } from 'svelte/transition';
  import ArrowLeftThin from 'svelte-material-icons/ArrowLeftThin.svelte';
  import Magnify from 'svelte-material-icons/Magnify.svelte';
  import Plus from 'svelte-material-icons/Plus.svelte';
  import { linear } from 'svelte/easing';
  import { api, ThumbnailFormat, type PersonResponseDto } from '@api';
  import ImageThumbnail from '../assets/thumbnail/image-thumbnail.svelte';
  import { cloneDeep } from 'lodash-es';
  import { handleError } from '$lib/utils/handle-error';
  import Close from 'svelte-material-icons/Close.svelte';
  import { createEventDispatcher, onMount } from 'svelte';
  import Restart from 'svelte-material-icons/Restart.svelte';
  import LoadingSpinner from '$lib/components/shared-components/loading-spinner.svelte';
  import { NotificationType, notificationController } from '../shared-components/notification/notification';
  import { browser } from '$app/environment';

  export let people: PersonResponseDto[];
  export let assetId: string;

  let searchedPeople: PersonResponseDto[] = [];
  let searchWord: string;
  let maxPeople = false;

  const dispatch = createEventDispatcher();

  let searchFaces = false;
  let searchName = '';

  let allPeople: PersonResponseDto[] = [];
  let editedPerson: number;
  let selectedPersonToReassign: (PersonResponseDto | null)[] = new Array<PersonResponseDto | null>(people.length);
  export let selectedPersonToCreate: (PersonToCreate | null)[] = new Array<PersonToCreate | null>(people.length);

  let showSeletecFaces = false;
  let showLoadingSpinner = false;

  let editedPeople = cloneDeep(people);

  onMount(async () => {
    const { data } = await api.personApi.getAllPeople({ withHidden: false });
    allPeople = data.people;
  });

  const searchPeople = async () => {
    searchedPeople = [];
    try {
      const { data } = await api.searchApi.searchPerson({ name: searchName });
      searchedPeople = data.filter((item) => item.id !== people[editedPerson].id);
      searchWord = searchName;
      if (data.length < 20) {
        maxPeople = false;
      } else {
        maxPeople = true;
      }
    } catch (error) {
      handleError(error, "Can't search people");
    }
  };

  $: {
    if (searchName !== '' && browser) {
      if (maxPeople === true || (!searchName.startsWith(searchWord) && maxPeople === false)) searchPeople();
    }
  }

  $: {
    searchedPeople = !searchName
      ? allPeople
      : allPeople
          .filter((person: PersonResponseDto) => person.name.toLowerCase().startsWith(searchName.toLowerCase()))
          .slice(0, 5);
  }

  function initInput(element: HTMLInputElement) {
    element.focus();
  }

  const handleBackButton = () => {
    searchName = '';
    searchFaces = false;
    selectedPersonToCreate = new Array<PersonToCreate | null>(people.length);
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
    // Calculate width and height from the coordinates
    const width = x2 - x1;
    const height = y2 - y1;

    // Create an image element and load the image source
    const img = new Image();
    img.src = imageSrc;

    // Wait for the image to load
    await new Promise((resolve) => {
      img.onload = resolve;
      img.onerror = () => resolve(null); // Handle image load errors
    });

    // Calculate the new width and height after zooming out
    const newWidth = width * 1.5;
    const newHeight = height * 1.5;

    // Create a canvas element to draw the zoomed-out image
    const canvas = document.createElement('canvas');
    canvas.width = newWidth;
    canvas.height = newHeight;

    // Draw the zoomed-out portion of the image onto the canvas
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(
        img,
        x1 - (newWidth - width) / 2,
        y1 - (newHeight - height) / 2,
        newWidth,
        newHeight,
        0,
        0,
        newWidth,
        newHeight,
      );

      // Convert the canvas content to base64
      const base64Image = canvas.toDataURL('image/webp');

      return base64Image;
    } else {
      return null;
    }
  }

  const handleReset = (index: number) => {
    editedPeople[index] = people[index];
    if (selectedPersonToReassign[index]) {
      selectedPersonToReassign[index] = null;
    }
    if (selectedPersonToCreate[index]) {
      selectedPersonToCreate[index] = null;
    }
  };

  const handleEditFaces = async () => {
    const numberOfChanges =
      selectedPersonToCreate.filter((person) => person !== null && person.canEdit !== false).length +
      selectedPersonToReassign.filter((person) => person !== null).length;
    if (numberOfChanges > 0) {
      showLoadingSpinner = true;
      try {
        for (let i = 0; i < selectedPersonToReassign.length; i++) {
          const personId = selectedPersonToReassign[i]?.id;
          if (personId) {
            await api.personApi.reassignFaces({
              id: personId,
              assetFaceUpdateDto: { data: [{ assetId: assetId, personId: people[i].id }] },
            });
            people[i] = selectedPersonToReassign[i] as PersonResponseDto;
          }
        }
        for (let i = 0; i < selectedPersonToCreate.length; i++) {
          const personToCreate = selectedPersonToCreate[i];
          if (personToCreate && personToCreate.canEdit !== false) {
            const { data } = await api.personApi.createPerson({
              assetFaceUpdateDto: { data: [{ assetId: assetId, personId: people[i].id }] },
            });
            people[i] = data;
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
      showLoadingSpinner = false;
    }
    dispatch('close');
  };

  const handleCreatePerson = async () => {
    const { data } = await api.personApi.getAssetFace({ id: people[editedPerson].id, assetId });
    const assetFace = data;
    for (let i = 0; i < people.length; i++) {
      if (people[i].id === people[editedPerson].id) {
        const data = await api.getAssetThumbnailUrl(assetId, ThumbnailFormat.Jpeg);
        const newFeaturePhoto = await zoomImageToBase64(
          data,
          assetFace.boundingBoxX1,
          assetFace.boundingBoxX2,
          assetFace.boundingBoxY1,
          assetFace.boundingBoxY2,
        );

        if (newFeaturePhoto) {
          selectedPersonToCreate[i] = { canEdit: true, thumbnail: data };
        }
        break;
      }
    }
    showSeletecFaces = false;
  };

  const handleReassignFace = (person: PersonResponseDto) => {
    selectedPersonToReassign[editedPerson] = person;
    editedPeople[editedPerson] = person;
    console.log(selectedPersonToReassign);
    showSeletecFaces = false;
  };

  const handlePersonPicker = async (index: number) => {
    editedPerson = index;
    searchedPeople = allPeople.filter((item) => item.id !== people[index].id);
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
        <ArrowLeftThin size="24" />
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
      {#each editedPeople as person, index}
        <div class="relative h-[115px] w-[95px]">
          <a href="/people/{person.id}">
            <div class="absolute left-0 top-0 h-[90px] w-[90px]">
              <ImageThumbnail
                curve
                shadow
                url={selectedPersonToCreate[index]?.thumbnail || api.getPeopleThumbnailUrl(person.id)}
                altText={person.name}
                title={person.name}
                widthStyle="90px"
                heightStyle="90px"
                thumbhash={null}
              />
              <p class="relative mt-1 truncate font-medium" title={person.name}>
                {person.name}
              </p>
            </div>
          </a>

          <div
            transition:blur={{ amount: 10, duration: 50 }}
            class="absolute -right-[5px] -top-[5px] h-[20px] w-[20px] rounded-full bg-blue-700"
          >
            {#if (selectedPersonToCreate[index] && selectedPersonToCreate[index]?.canEdit !== false) || selectedPersonToReassign[index]}
              <button on:click={() => handleReset(index)} class="flex h-full w-full">
                <div class="absolute left-1/2 top-1/2 translate-x-[-50%] translate-y-[-50%] transform">
                  <Restart size={18} />
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
      {/each}
    </div>
  </div>
</section>

{#if showSeletecFaces}
  <section
    transition:fly={{ x: 360, duration: 100, easing: linear }}
    class="absolute top-0 z-[2001] h-full overflow-x-hidden p-2 dark:bg-immich-dark-bg dark:text-immich-dark-fg"
  >
    <div class="flex place-items-center justify-between gap-2">
      {#if !searchFaces}
        <div class="flex items-center gap-2">
          <button
            class="flex place-content-center rounded-full p-3 transition-colors hover:bg-gray-200 dark:text-immich-dark-fg dark:hover:bg-gray-900"
            on:click={handleBackButton}
          >
            <ArrowLeftThin size="24" />
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
            <Magnify size="24" />
          </button>

          <button
            class="flex place-content-center place-items-center rounded-full p-3 transition-colors hover:bg-gray-200 dark:text-immich-dark-fg dark:hover:bg-gray-900"
            on:click={() => handleCreatePerson()}
            title="Create new person"
          >
            <Plus size="24" />
          </button>
        </div>
      {:else}
        <button
          class="flex place-content-center rounded-full p-3 transition-colors hover:bg-gray-200 dark:text-immich-dark-fg dark:hover:bg-gray-900"
          on:click={handleBackButton}
        >
          <ArrowLeftThin size="24" />
        </button>
        <input
          class="w-full gap-2 bg-immich-bg dark:bg-immich-dark-bg"
          type="text"
          placeholder="Name or nickname"
          bind:value={searchName}
          use:initInput
        />
        <button
          class="flex place-content-center place-items-center rounded-full p-3 transition-colors hover:bg-gray-200 dark:text-immich-dark-fg dark:hover:bg-gray-900"
          on:click={() => (searchFaces = false)}
        >
          <Close size="24" />
        </button>
      {/if}
    </div>
    <div class="px-4 py-4 text-sm">
      <h2 class="mb-8 mt-4 uppercase">All people</h2>
      <div class="immich-scrollbar mt-4 flex flex-wrap gap-2 overflow-y-auto">
        {#each searchName == '' ? allPeople : searchedPeople as person (person.id)}
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
        {/each}
      </div>
    </div>
  </section>
{/if}
