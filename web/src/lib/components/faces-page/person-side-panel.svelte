<script lang="ts">
  import { fly } from 'svelte/transition';
  import { linear } from 'svelte/easing';
  import { api, type PersonResponseDto, type AssetFaceResponseDto, AssetTypeEnum } from '@api';
  import ImageThumbnail from '../assets/thumbnail/image-thumbnail.svelte';
  import { handleError } from '$lib/utils/handle-error';
  import { createEventDispatcher, onMount } from 'svelte';
  import LoadingSpinner from '$lib/components/shared-components/loading-spinner.svelte';
  import { NotificationType, notificationController } from '../shared-components/notification/notification';
  import { mdiArrowLeftThin, mdiRestart } from '@mdi/js';
  import Icon from '../elements/icon.svelte';
  import { boundingBoxesArray } from '$lib/stores/people.store';
  import { websocketStore } from '$lib/stores/websocket';
  import AssignFaceSidePanel from './assign-face-side-panel.svelte';
  import { getPersonNameWithHiddenValue } from '$lib/utils/person';
  import { timeBeforeShowLoadingSpinner } from '$lib/constants';

  export let assetId: string;
  export let assetType: AssetTypeEnum;

  // keep track of the changes
  let numberOfPersonToCreate: string[] = [];
  let numberOfAssetFaceGenerated: string[] = [];

  // faces
  let peopleWithFaces: AssetFaceResponseDto[] = [];
  let selectedPersonToReassign: (PersonResponseDto | null)[];
  let selectedPersonToCreate: (string | null)[];
  let editedPersonIndex: number;

  // loading spinners
  let isShowLoadingDone = false;
  let isShowLoadingPeople = false;

  // search people
  let showSeletecFaces = false;
  let allPeople: PersonResponseDto[] = [];

  // timers
  let loaderLoadingDoneTimeout: NodeJS.Timeout;
  let automaticRefreshTimeout: NodeJS.Timeout;

  const { onPersonThumbnail } = websocketStore;
  const dispatch = createEventDispatcher<{
    close: void;
    refresh: void;
  }>();

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
    const timeout = setTimeout(() => (isShowLoadingPeople = true), timeBeforeShowLoadingSpinner);
    try {
      const { data } = await api.personApi.getAllPeople({ withHidden: true });
      allPeople = data.people;
      const result = await api.faceApi.getFaces({ id: assetId });
      peopleWithFaces = result.data;
      selectedPersonToCreate = Array.from({ length: peopleWithFaces.length });
      selectedPersonToReassign = Array.from({ length: peopleWithFaces.length });
    } catch (error) {
      handleError(error, "Can't get faces");
    } finally {
      clearTimeout(timeout);
    }
    isShowLoadingPeople = false;
  });

  const isEqual = (a: string[], b: string[]): boolean => {
    return b.every((valueB) => a.includes(valueB));
  };

  const handleBackButton = () => {
    dispatch('close');
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
    loaderLoadingDoneTimeout = setTimeout(() => (isShowLoadingDone = true), timeBeforeShowLoadingSpinner);
    const numberOfChanges =
      selectedPersonToCreate.filter((person) => person !== null).length +
      selectedPersonToReassign.filter((person) => person !== null).length;
    if (numberOfChanges > 0) {
      try {
        for (const [index, peopleWithFace] of peopleWithFaces.entries()) {
          const personId = selectedPersonToReassign[index]?.id;

          if (personId) {
            await api.faceApi.reassignFacesById({
              id: personId,
              faceDto: { id: peopleWithFace.id },
            });
          } else if (selectedPersonToCreate[index]) {
            const { data } = await api.personApi.createPerson();
            numberOfPersonToCreate.push(data.id);
            await api.faceApi.reassignFacesById({
              id: data.id,
              faceDto: { id: peopleWithFace.id },
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
      automaticRefreshTimeout = setTimeout(() => dispatch('refresh'), 15_000);
    }
  };

  const handleCreatePerson = (newFeaturePhoto: string | null) => {
    const personToUpdate = peopleWithFaces.find((person) => person.id === peopleWithFaces[editedPersonIndex].id);
    if (newFeaturePhoto && personToUpdate) {
      selectedPersonToCreate[peopleWithFaces.indexOf(personToUpdate)] = newFeaturePhoto;
    }
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
  class="absolute top-0 z-[2000] h-full w-[360px] overflow-x-hidden p-2 bg-immich-bg dark:bg-immich-dark-bg dark:text-immich-dark-fg"
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
                on:focus={() => ($boundingBoxesArray = [peopleWithFaces[index]])}
                on:mouseover={() => ($boundingBoxesArray = [peopleWithFaces[index]])}
                on:mouseleave={() => ($boundingBoxesArray = [])}
              >
                <div class="relative">
                  <ImageThumbnail
                    curve
                    shadow
                    url={selectedPersonToCreate[index] ||
                      api.getPeopleThumbnailUrl(selectedPersonToReassign[index]?.id || face.person.id)}
                    altText={selectedPersonToReassign[index]
                      ? selectedPersonToReassign[index]?.name || ''
                      : selectedPersonToCreate[index]
                        ? 'new person'
                        : getPersonNameWithHiddenValue(face.person?.name, face.person?.isHidden)}
                    title={selectedPersonToReassign[index]
                      ? selectedPersonToReassign[index]?.name || ''
                      : selectedPersonToCreate[index]
                        ? 'new person'
                        : getPersonNameWithHiddenValue(face.person?.name, face.person?.isHidden)}
                    widthStyle="90px"
                    heightStyle="90px"
                    thumbhash={null}
                    hidden={selectedPersonToReassign[index]
                      ? selectedPersonToReassign[index]?.isHidden
                      : selectedPersonToCreate[index]
                        ? false
                        : face.person?.isHidden}
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
  <AssignFaceSidePanel
    {peopleWithFaces}
    {allPeople}
    {editedPersonIndex}
    {assetType}
    {assetId}
    on:close={() => (showSeletecFaces = false)}
    on:createPerson={(event) => handleCreatePerson(event.detail)}
    on:reassign={(event) => handleReassignFace(event.detail)}
  />
{/if}
