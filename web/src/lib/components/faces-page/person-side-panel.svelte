<script lang="ts">
  import { fly } from 'svelte/transition';
  import { linear } from 'svelte/easing';
  import { api, type PersonResponseDto, type AssetFaceResponseDto, type AssetResponseDto } from '@api';
  import ImageThumbnail from '../assets/thumbnail/image-thumbnail.svelte';
  import { handleError } from '$lib/utils/handle-error';
  import { createEventDispatcher, onMount } from 'svelte';
  import LoadingSpinner from '$lib/components/shared-components/loading-spinner.svelte';
  import { NotificationType, notificationController } from '../shared-components/notification/notification';
  import { mdiAccountOff, mdiArrowLeftThin, mdiFaceMan, mdiRestart, mdiSelect } from '@mdi/js';
  import Icon from '../elements/icon.svelte';
  import { boundingBoxesArray } from '$lib/stores/people.store';
  import { websocketStore } from '$lib/stores/websocket';
  import AssignFaceSidePanel from './assign-face-side-panel.svelte';
  import { getPersonNameWithHiddenValue, zoomImageToBase64 } from '$lib/utils/person';
  import UnassignedFacesSidePannel from './unassigned-faces-side-pannel.svelte';
  import type { FaceWithGeneretedThumbnail } from '$lib/utils/people-utils';
  import Button from '../elements/buttons/button.svelte';
  import { timeBeforeShowLoadingSpinner } from '$lib/constants';

  export let asset: AssetResponseDto;

  // keep track of the changes
  let idsOfPersonToCreate: string[] = [];
  let idsOfAssetFaceGenerated: string[] = [];

  // faces
  let peopleWithFaces: AssetFaceResponseDto[] = [];
  let selectedPersonToReassign: (PersonResponseDto | null)[];
  let selectedPersonToCreate: (string | null)[];
  let selectedPersonToAdd: FaceWithGeneretedThumbnail[] = [];
  let selectedPersonToUnassign: FaceWithGeneretedThumbnail[] = [];
  let selectedPersonToRemove: boolean[] = [];
  let unassignedFaces: FaceWithGeneretedThumbnail[] = [];
  let editedPersonIndex: number;
  let shouldRefresh: boolean = false;

  // loading spinners
  let isShowLoadingDone = false;
  let isShowLoadingPeople = false;

  // other modals
  let showSeletecFaces = false;
  let showUnassignedFaces = false;
  let isSelectingFaces = false;
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
  $: numberOfFacesToUnassign = selectedPersonToRemove ? selectedPersonToRemove.filter(Boolean).length : 0;
  $: {
    if ($onPersonThumbnail) {
      idsOfAssetFaceGenerated.push($onPersonThumbnail);
      if (
        isEqual(idsOfAssetFaceGenerated, idsOfPersonToCreate) &&
        loaderLoadingDoneTimeout &&
        automaticRefreshTimeout &&
        selectedPersonToCreate.filter((person) => person !== null).length +
          selectedPersonToAdd.filter((face) => face.person === null).length ===
          idsOfPersonToCreate.length
      ) {
        clearTimeout(loaderLoadingDoneTimeout);
        clearTimeout(automaticRefreshTimeout);
        dispatch('refresh');
      }
    }
  }

  onMount(async () => {
    if (asset === null) {
      return;
    }
    const timeout = setTimeout(() => (isShowLoadingPeople = true), timeBeforeShowLoadingSpinner);
    try {
      const { data } = await api.personApi.getAllPeople({ withHidden: true });
      allPeople = data.people;
      const result = await api.faceApi.getFaces({ faceId: asset.id });
      peopleWithFaces = result.data;

      selectedPersonToCreate = Array.from({ length: peopleWithFaces.length });
      selectedPersonToReassign = Array.from({ length: peopleWithFaces.length });
      selectedPersonToRemove = Array.from({ length: peopleWithFaces.length });
      const peopleWithGeneratedImage = await Promise.all(
        peopleWithFaces.map(async (personWithFace) => {
          if (personWithFace.person || asset === null) {
            return null;
          } else {
            const image = await zoomImageToBase64(personWithFace, asset.type, asset.id);
            return image ? { ...personWithFace, customThumbnail: image } : null;
          }
        }),
      );
      unassignedFaces = peopleWithGeneratedImage.filter((item): item is FaceWithGeneretedThumbnail => item !== null);
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
    if (isSelectingFaces) {
      isSelectingFaces = false;
      selectedPersonToRemove = Array.from({ length: peopleWithFaces.length });
      return;
    }
    if (shouldRefresh) {
      dispatch('refresh');
      return;
    }
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

  const handleOpenAvailableFaces = () => {
    showUnassignedFaces = true;
  };

  const closeAssigningFaceModal = () => {
    $boundingBoxesArray = [];
    showSeletecFaces = false;
  };

  const handleMouseLeaveFaceThumbnail = () => {
    if (!showSeletecFaces) {
      $boundingBoxesArray = [];
    }
  };

  const handleSelectFaces = () => {
    isSelectingFaces = !isSelectingFaces;
  };

  const handleSelectFace = (index: number) => {
    if (!isSelectingFaces) {
      return;
    }
    selectedPersonToRemove[index] = !selectedPersonToRemove[index];
  };

  const handleRemoveAddedFace = (indexToRemove: number) => {
    $boundingBoxesArray = [];
    selectedPersonToAdd = selectedPersonToAdd.filter((_, index) => index !== indexToRemove);
  };

  const handleAddRemovedFace = (indexToRemove: number) => {
    $boundingBoxesArray = [];
    unassignedFaces = unassignedFaces
      .map((obj) => (obj && obj.id === selectedPersonToUnassign[indexToRemove].id ? null : obj))
      .filter((item): item is FaceWithGeneretedThumbnail => item !== null) as FaceWithGeneretedThumbnail[];

    selectedPersonToUnassign = selectedPersonToUnassign.filter((_, index) => index !== indexToRemove);
  };

  const handleUnassignFaces = async () => {
    if (asset === null) {
      return;
    }
    if (numberOfFacesToUnassign > 0) {
      for (const [i, peopleWithFace] of peopleWithFaces.entries()) {
        if (selectedPersonToRemove[i]) {
          const image = await zoomImageToBase64(peopleWithFace, asset.type, asset.id);
          if (image) {
            selectedPersonToUnassign.push({ ...peopleWithFace, customThumbnail: image });
            // Trigger reactivity
            selectedPersonToUnassign = selectedPersonToUnassign;
            if (selectedPersonToReassign[i]) {
              selectedPersonToReassign[i] = null;
            }
            if (selectedPersonToCreate[i]) {
              selectedPersonToCreate[i] = null;
            }
          }
        }
      }
      const uniqueIds = new Set(selectedPersonToUnassign.map((objA) => objA.id));
      selectedPersonToAdd = selectedPersonToAdd.filter((objB) => !uniqueIds.has(objB.id));
    }
    selectedPersonToRemove = Array.from({ length: peopleWithFaces.length });
    isSelectingFaces = false;
  };

  const handleEditFaces = async () => {
    loaderLoadingDoneTimeout = setTimeout(() => (isShowLoadingDone = true), timeBeforeShowLoadingSpinner);
    const numberOfChanges =
      selectedPersonToCreate.filter((person) => person !== null && person !== undefined).length +
      selectedPersonToReassign.filter((person) => person !== null && person !== undefined).length +
      selectedPersonToAdd.filter((person) => person !== null && person !== undefined).length +
      selectedPersonToUnassign.filter((person) => person !== null && person !== undefined).length;
    if (numberOfChanges > 0) {
      try {
        for (const [index, peopleWithFace] of peopleWithFaces.entries()) {
          const personId = selectedPersonToReassign[index]?.id;

          if (personId) {
            await api.faceApi.reassignFace({
              id: peopleWithFace.id,
              reassignFaceDto: { personId },
            });
          } else if (selectedPersonToCreate[index]) {
            const { data } = await api.personApi.createPerson();
            idsOfPersonToCreate.push(data.id);
            await api.faceApi.reassignFace({
              id: peopleWithFace.id,
              reassignFaceDto: { personId: data.id },
            });
          }
        }
        for (const face of selectedPersonToAdd) {
          if (face.person) {
            await api.faceApi.reassignFace({
              id: face.id,
              reassignFaceDto: { personId: face.person.id },
            });
          } else {
            const { data } = await api.personApi.createPerson();
            idsOfPersonToCreate.push(data.id);
            await api.faceApi.reassignFace({
              id: face.id,
              reassignFaceDto: { personId: data.id },
            });
          }
        }

        for (const face of selectedPersonToUnassign) {
          await api.faceApi.unassignFace({
            id: face.id,
          });
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
    if (idsOfPersonToCreate.length === 0) {
      clearTimeout(loaderLoadingDoneTimeout);
      dispatch('refresh');
    } else {
      automaticRefreshTimeout = setTimeout(() => dispatch('refresh'), 15_000);
    }
  };

  const handleCreatePerson = (newFeaturePhoto: string | null) => {
    $boundingBoxesArray = [];
    const personToUpdate = peopleWithFaces.find((person) => person.id === peopleWithFaces[editedPersonIndex].id);
    if (newFeaturePhoto && personToUpdate) {
      selectedPersonToCreate[peopleWithFaces.indexOf(personToUpdate)] = newFeaturePhoto;
    }
    showSeletecFaces = false;
  };

  const handleReassignFace = (person: PersonResponseDto | null) => {
    $boundingBoxesArray = [];
    if (person) {
      selectedPersonToReassign[editedPersonIndex] = person;
    }
    showSeletecFaces = false;
  };

  const handleCreateOrReassignFaceFromUnassignedFace = (face: FaceWithGeneretedThumbnail) => {
    selectedPersonToAdd.push(face);
    selectedPersonToAdd = selectedPersonToAdd;
    showUnassignedFaces = false;
  };

  const handlePersonPicker = async (index: number) => {
    editedPersonIndex = index;
    $boundingBoxesArray = [peopleWithFaces[index]];
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
      <p class="flex text-lg text-immich-fg dark:text-immich-dark-fg">
        {isSelectingFaces ? 'Select Faces' : 'Edit faces'}
      </p>
    </div>
    {#if !isShowLoadingDone}
      <div class="flex items-center gap-2">
        {#if !isSelectingFaces && unassignedFaces.length > 0}
          <button
            class="justify-self-end rounded-lg p-2 hover:bg-immich-dark-primary hover:dark:bg-immich-dark-primary/50"
            on:click={handleOpenAvailableFaces}
            title="Faces available"
          >
            <div>
              <Icon path={mdiFaceMan} />
            </div>
          </button>
        {/if}
        {#if !peopleWithFaces.every((item) => item.person === null)}
          <button
            class="justify-self-end rounded-lg p-2 hover:bg-immich-dark-primary hover:dark:bg-immich-dark-primary/50"
            on:click={handleSelectFaces}
            title="Select faces to unassign"
          >
            <div>
              <Icon path={mdiSelect} />
            </div>
          </button>
        {/if}
        {#if !isSelectingFaces}
          <button
            class="justify-self-end rounded-lg p-2 hover:bg-immich-dark-primary hover:dark:bg-immich-dark-primary/50"
            on:click={handleEditFaces}
          >
            Done
          </button>
        {/if}
      </div>
    {:else}
      <LoadingSpinner />
    {/if}
  </div>

  <div class="px-4 py-4 text-sm">
    <div class="flex items-center justify-between gap-2 h-10">
      {#if peopleWithFaces.every((item) => item.person === null)}
        <div class="flex items-center justify-center w-full">
          <div class="grid place-items-center">
            <Icon path={mdiAccountOff} size="3.5em" />
            <p class="mt-5 font-medium">No faces currently visible</p>
          </div>
        </div>
      {:else}
        <div>Faces visible</div>
      {/if}

      {#if isSelectingFaces && selectedPersonToRemove && selectedPersonToRemove.some(Boolean)}
        <Button
          size="xs"
          color="red"
          title="Unassign faces"
          shadow={false}
          rounded="full"
          on:click={handleUnassignFaces}
        >
          Unassign Faces
        </Button>
      {/if}
    </div>
    <div class="mt-2 flex flex-wrap gap-2">
      {#if isShowLoadingPeople}
        <div class="flex w-full justify-center">
          <LoadingSpinner />
        </div>
      {:else}
        {#each peopleWithFaces as face, index}
          {#if face.person && !unassignedFaces.some((unassignedFace) => unassignedFace.id === face.id) && !selectedPersonToUnassign.some((unassignedFace) => unassignedFace.id === face.id)}
            <div class="relative z-[20001] h-[115px] w-[95px]">
              <div
                role="button"
                tabindex={index}
                class="absolute left-0 top-0 h-[90px] w-[90px] cursor-default"
                on:focus={() => ($boundingBoxesArray = [peopleWithFaces[index]])}
                on:mouseover={() => ($boundingBoxesArray = [peopleWithFaces[index]])}
                on:mouseleave={handleMouseLeaveFaceThumbnail}
                on:click={() => handleSelectFace(index)}
                on:keydown={() => handleSelectFace(index)}
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
                    hidden={isSelectingFaces
                      ? false
                      : selectedPersonToReassign[index]
                        ? selectedPersonToReassign[index]?.isHidden
                        : selectedPersonToCreate[index]
                          ? false
                          : face.person?.isHidden}
                    persistentBorder={isSelectingFaces ? selectedPersonToRemove[index] : false}
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
                {#if !isSelectingFaces}
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
                {/if}
              </div>
            </div>
          {/if}
        {/each}
      {/if}
    </div>
    {#if selectedPersonToAdd.length > 0}
      <div class="mt-8">
        <p>Faces to add</p>
        <div class="mt-4 flex flex-wrap gap-2">
          {#each selectedPersonToAdd as face, index}
            {#if face}
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
                      url={face.person && face.person.id
                        ? api.getPeopleThumbnailUrl(face.person.id)
                        : face.customThumbnail}
                      altText={'New person'}
                      title={'New person'}
                      widthStyle="90px"
                      heightStyle="90px"
                      thumbhash={null}
                    />
                  </div>
                  {#if face.person?.name}
                    <p class="relative mt-1 truncate font-medium" title={face.person?.name}>
                      {face.person?.name}
                    </p>{/if}
                  {#if !isSelectingFaces}
                    <div class="absolute -right-[5px] -top-[5px] h-[20px] w-[20px] rounded-full bg-red-700">
                      <button on:click={() => handleRemoveAddedFace(index)} class="flex h-full w-full">
                        <div
                          class="absolute left-1/2 top-1/2 h-[2px] w-[14px] translate-x-[-50%] translate-y-[-50%] transform bg-white"
                        />
                      </button>
                    </div>
                  {/if}
                </div>
              </div>
            {/if}
          {/each}
        </div>
      </div>
    {/if}
    {#if selectedPersonToUnassign.length > 0}
      <div class="mt-2">
        <p>Faces to unassign</p>
        <div class="mt-4 flex flex-wrap gap-2">
          {#each selectedPersonToUnassign as face, index}
            {#if face && face.person}
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
                      url={face.customThumbnail}
                      altText={'New person'}
                      title={'New person'}
                      widthStyle="90px"
                      heightStyle="90px"
                      thumbhash={null}
                    />
                  </div>
                  {#if face.person?.name}
                    <p class="relative mt-1 truncate font-medium" title={face.person?.name}>
                      {face.person?.name}
                    </p>{/if}
                  {#if !isSelectingFaces}
                    <div class="absolute -right-[5px] -top-[5px] h-[20px] w-[20px] rounded-full bg-red-700">
                      <button on:click={() => handleAddRemovedFace(index)} class="flex h-full w-full">
                        <div
                          class="absolute left-1/2 top-1/2 h-[2px] w-[14px] translate-x-[-50%] translate-y-[-50%] transform bg-white"
                        />
                      </button>
                    </div>
                  {/if}
                </div>
              </div>
            {/if}
          {/each}
        </div>
      </div>
    {/if}
  </div>
</section>

{#if showSeletecFaces}
  <AssignFaceSidePanel
    {asset}
    personWithFace={peopleWithFaces[editedPersonIndex]}
    {allPeople}
    on:close={closeAssigningFaceModal}
    on:createPerson={(event) => handleCreatePerson(event.detail)}
    on:reassign={(event) => handleReassignFace(event.detail)}
  />
{/if}

{#if showUnassignedFaces}
  <UnassignedFacesSidePannel
    {asset}
    {allPeople}
    {unassignedFaces}
    {selectedPersonToAdd}
    on:close={() => (showUnassignedFaces = false)}
    on:createPerson={(event) => handleCreateOrReassignFaceFromUnassignedFace(event.detail)}
    on:reassign={(event) => handleCreateOrReassignFaceFromUnassignedFace(event.detail)}
  />
{/if}
