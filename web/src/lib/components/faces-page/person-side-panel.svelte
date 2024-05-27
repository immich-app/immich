<script lang="ts">
  import LoadingSpinner from '$lib/components/shared-components/loading-spinner.svelte';
  import { timeBeforeShowLoadingSpinner } from '$lib/constants';
  import { boundingBoxesArray } from '$lib/stores/people.store';
  import { websocketEvents } from '$lib/stores/websocket';
  import { getPeopleThumbnailUrl, handlePromiseError } from '$lib/utils';
  import { handleError } from '$lib/utils/handle-error';
  import { getPersonNameWithHiddenValue, zoomImageToBase64 } from '$lib/utils/person';
  import {
    AssetTypeEnum,
    createPerson,
    getAllPeople,
    getFaces,
    reassignFacesById,
    unassignFace,
    type AssetFaceResponseDto,
    type PersonResponseDto,
  } from '@immich/sdk';
  import { mdiAccountOff, mdiArrowLeftThin, mdiClose, mdiFaceMan, mdiMinus, mdiRestart } from '@mdi/js';
  import { onMount } from 'svelte';
  import { linear } from 'svelte/easing';
  import { fly } from 'svelte/transition';
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import type { FaceWithGeneratedThumbnail } from '$lib/utils/people-utils';
  import {
    NotificationType,
    notificationController,
  } from '$lib/components/shared-components/notification/notification';
  import ImageThumbnail from '$lib/components/assets/thumbnail/image-thumbnail.svelte';
  import AssignFaceSidePanel from '$lib/components/faces-page/assign-face-side-panel.svelte';
  import UnassignedFacesSidePanel from '$lib/components/faces-page/unassigned-faces-side-panel.svelte';
  import Icon from '$lib/components/elements/icon.svelte';

  export let assetId: string;
  export let assetType: AssetTypeEnum;
  export let onClose = () => {};
  export let onRefresh = () => {};

  // keep track of the changes
  let peopleToCreate: string[] = [];
  let assetFaceGenerated: string[] = [];

  // faces
  let allFaces: AssetFaceResponseDto[] = [];
  let peopleWithFaces: AssetFaceResponseDto[] = [];
  let selectedPersonToReassign: Record<string, PersonResponseDto> = {};
  let selectedPersonToCreate: Record<string, string> = {};
  let selectedPersonToAdd: Record<string, FaceWithGeneratedThumbnail> = {};
  let selectedFaceToRemove: Record<string, AssetFaceResponseDto> = {};
  let editedPerson: PersonResponseDto;
  let editedFace: AssetFaceResponseDto;
  let unassignedFaces: FaceWithGeneratedThumbnail[] = [];

  // loading spinners
  let isShowLoadingDone = false;
  let isShowLoadingPeople = false;

  // search people
  let showSelectedFaces = false;
  let showUnassignedFaces = false;
  let allPeople: PersonResponseDto[] = [];

  // timers
  let loaderLoadingDoneTimeout: ReturnType<typeof setTimeout>;
  let automaticRefreshTimeout: ReturnType<typeof setTimeout>;

  $: mapFacesToBeCreated = Object.entries(selectedPersonToAdd)
    .filter(([_, value]) => value.person === null)
    .map(([key, _]) => key);

  const thumbnailWidth = '90px';

  const generatePeopleWithoutFaces = async () => {
    const peopleWithGeneratedImage = await Promise.all(
      allFaces.map(async (personWithFace) => {
        if (personWithFace.person === null) {
          const image = await zoomImageToBase64(personWithFace, assetType, assetId);
          return { ...personWithFace, customThumbnail: image };
        }
      }),
    );
    unassignedFaces = peopleWithGeneratedImage.filter((item): item is FaceWithGeneratedThumbnail => item !== undefined);
  };

  async function loadPeople() {
    const timeout = setTimeout(() => (isShowLoadingPeople = true), timeBeforeShowLoadingSpinner);
    try {
      const { people } = await getAllPeople({ withHidden: true });
      allPeople = people;
      allFaces = await getFaces({ id: assetId });
      peopleWithFaces = allFaces.filter((face) => face.person);
      await generatePeopleWithoutFaces();
    } catch (error) {
      handleError(error, "Can't get faces");
    } finally {
      clearTimeout(timeout);
    }
    isShowLoadingPeople = false;
  }

  /*
   * we wait for the server to create the feature photo for:
   * - people which has been reassigned to a new person
   * - faces removed assigned to a new person
   *
   * if after 15 seconds the server has not generated the feature photos,
   * we go back to the detail-panel
   */
  const onPersonThumbnail = (personId: string) => {
    assetFaceGenerated.push(personId);

    if (
      isEqual(assetFaceGenerated, peopleToCreate) &&
      isEqual(assetFaceGenerated, mapFacesToBeCreated) &&
      loaderLoadingDoneTimeout &&
      automaticRefreshTimeout
    ) {
      clearTimeout(loaderLoadingDoneTimeout);
      clearTimeout(automaticRefreshTimeout);
      onRefresh();
    }
  };

  onMount(() => {
    handlePromiseError(loadPeople());
    return websocketEvents.on('on_person_thumbnail', onPersonThumbnail);
  });

  const isEqual = (a: string[], b: string[]): boolean => {
    return b.every((valueB) => a.includes(valueB));
  };

  const handleReset = (id: string) => {
    if (selectedPersonToReassign[id]) {
      delete selectedPersonToReassign[id];

      // trigger reactivity
      selectedPersonToReassign = selectedPersonToReassign;
    }
    if (selectedPersonToCreate[id]) {
      delete selectedPersonToCreate[id];

      // trigger reactivity
      selectedPersonToCreate = selectedPersonToCreate;
    }
  };

  const handleRemoveFace = (face: AssetFaceResponseDto) => {
    selectedFaceToRemove[face.id] = face;
  };

  const handleAbortRemove = (id: string) => {
    delete selectedFaceToRemove[id];
    selectedFaceToRemove = selectedFaceToRemove;
  };

  const handleEditFaces = async () => {
    loaderLoadingDoneTimeout = setTimeout(() => (isShowLoadingDone = true), timeBeforeShowLoadingSpinner);
    const numberOfChanges =
      Object.keys(selectedPersonToCreate).length +
      Object.keys(selectedPersonToReassign).length +
      Object.keys(selectedFaceToRemove).length +
      Object.keys(selectedPersonToAdd).length;

    if (numberOfChanges > 0) {
      try {
        for (const personWithFace of peopleWithFaces) {
          const personId = selectedPersonToReassign[personWithFace.id]?.id;

          if (personId) {
            await reassignFacesById({
              id: personId,
              faceDto: { id: personWithFace.id },
            });
          } else if (selectedPersonToCreate[personWithFace.id]) {
            const data = await createPerson({ personCreateDto: {} });
            peopleToCreate.push(data.id);
            await reassignFacesById({
              id: data.id,
              faceDto: { id: personWithFace.id },
            });
          }
        }

        for (const [id, face] of Object.entries(selectedPersonToAdd)) {
          if (face.person) {
            await reassignFacesById({
              id: face.person.id,
              faceDto: { id },
            });
          } else {
            const data = await createPerson({ personCreateDto: {} });
            peopleToCreate.push(data.id);
            await reassignFacesById({
              id: data.id,
              faceDto: { id },
            });
          }
        }

        for (const [id] of Object.entries(selectedFaceToRemove)) {
          await unassignFace({
            id,
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
    if (peopleToCreate.length === 0) {
      clearTimeout(loaderLoadingDoneTimeout);
      onRefresh();
    } else {
      automaticRefreshTimeout = setTimeout(() => onRefresh(), 15_000);
    }
  };

  const handleCreatePerson = (newFeaturePhoto: string | null) => {
    if (newFeaturePhoto) {
      selectedPersonToCreate[editedFace.id] = newFeaturePhoto;
    }
    showSelectedFaces = false;
  };

  const handleReassignFace = (person: PersonResponseDto | null) => {
    if (person) {
      selectedPersonToReassign[editedFace.id] = person;
    }
    showSelectedFaces = false;
  };

  const handleFacePicker = (face: AssetFaceResponseDto) => {
    if (face.person) {
      editedFace = face;
      editedPerson = face.person;
      showSelectedFaces = true;
    }
  };
  const handleCreateOrReassignFaceFromUnassignedFace = (face: FaceWithGeneratedThumbnail) => {
    selectedPersonToAdd[face.id] = face;
    selectedPersonToAdd = selectedPersonToAdd;
    showUnassignedFaces = false;
  };

  const handleOpenAvailableFaces = () => {
    showUnassignedFaces = !showUnassignedFaces;
  };
  const handleRemoveAddedFace = (face: FaceWithGeneratedThumbnail) => {
    $boundingBoxesArray = [];
    delete selectedPersonToAdd[face.id];

    // trigger reactivity
    selectedPersonToAdd = selectedPersonToAdd;
  };
  const handleRemoveAllFaces = () => {
    for (const face of peopleWithFaces) {
      selectedFaceToRemove[face.id] = face;
    }
  };
</script>

<section
  transition:fly={{ x: 360, duration: 100, easing: linear }}
  class="absolute top-0 z-[2000] h-full w-[360px] overflow-x-hidden p-2 bg-immich-bg dark:bg-immich-dark-bg dark:text-immich-dark-fg"
>
  <div class="flex place-items-center justify-between gap-2">
    <div class="flex items-center gap-2">
      <CircleIconButton icon={mdiArrowLeftThin} title="Back" on:click={onClose} />
      <p class="flex text-lg text-immich-fg dark:text-immich-dark-fg">Edit faces</p>
    </div>
    {#if !isShowLoadingDone}
      <div class="flex gap-2">
        {#if peopleWithFaces.length > Object.keys(selectedFaceToRemove).length}
          <button
            type="button"
            class="justify-self-end rounded-lg p-2 hover:bg-immich-dark-primary hover:dark:bg-immich-dark-primary/50"
            on:click={handleRemoveAllFaces}
            title="Remove all faces"
          >
            <div>
              <Icon path={mdiClose} />
            </div>
          </button>
        {/if}
        {#if (unassignedFaces.length > 0 && unassignedFaces.length > Object.keys(selectedPersonToAdd).length) || Object.keys(selectedFaceToRemove).length > 0}
          <button
            type="button"
            class="justify-self-end rounded-lg p-2 hover:bg-immich-dark-primary hover:dark:bg-immich-dark-primary/50"
            on:click={handleOpenAvailableFaces}
            title="Faces available"
          >
            <div>
              <Icon path={mdiFaceMan} />
            </div>
          </button>
        {/if}
        <button
          type="button"
          class="justify-self-end rounded-lg p-2 hover:bg-immich-dark-primary hover:dark:bg-immich-dark-primary/50"
          on:click={() => handleEditFaces()}
        >
          Done
        </button>
      </div>
    {:else}
      <LoadingSpinner />
    {/if}
  </div>
  {#if peopleWithFaces.length > 0}
    <div class="px-4 py-4 text-sm">
      <div class="mt-4 flex flex-wrap gap-2">
        {#if isShowLoadingPeople}
          <div class="flex w-full justify-center">
            <LoadingSpinner />
          </div>
        {:else}
          {#each peopleWithFaces as face, index}
            {#if face.person && !selectedFaceToRemove[face.id]}
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
                    {#if selectedPersonToCreate[face.id]}
                      <ImageThumbnail
                        curve
                        shadow
                        url={selectedPersonToCreate[face.id]}
                        altText={selectedPersonToCreate[face.id]}
                        title={'New person'}
                        widthStyle={thumbnailWidth}
                        heightStyle={thumbnailWidth}
                      />
                    {:else if selectedPersonToReassign[face.id]}
                      <ImageThumbnail
                        curve
                        shadow
                        url={getPeopleThumbnailUrl(selectedPersonToReassign[face.id].id)}
                        altText={selectedPersonToReassign[face.id]?.name || selectedPersonToReassign[face.id].id}
                        title={getPersonNameWithHiddenValue(
                          selectedPersonToReassign[face.id].name,
                          face.person?.isHidden,
                        )}
                        widthStyle={thumbnailWidth}
                        heightStyle={thumbnailWidth}
                        hidden={selectedPersonToReassign[face.id].isHidden}
                      />
                    {:else}
                      <ImageThumbnail
                        curve
                        shadow
                        url={getPeopleThumbnailUrl(face.person.id)}
                        altText={face.person.name || face.person.id}
                        title={getPersonNameWithHiddenValue(face.person.name, face.person.isHidden)}
                        widthStyle={thumbnailWidth}
                        heightStyle={thumbnailWidth}
                        hidden={face.person.isHidden}
                      />
                    {/if}
                  </div>

                  {#if !selectedPersonToCreate[face.id]}
                    <p class="relative mt-1 truncate font-medium" title={face.person?.name}>
                      {#if selectedPersonToReassign[face.id]?.id}
                        {selectedPersonToReassign[face.id]?.name}
                      {:else}
                        {face.person?.name}
                      {/if}
                    </p>
                  {/if}
                  {#if !selectedPersonToCreate[face.id] && !selectedPersonToReassign[face.id]}
                    <div class="absolute -left-[8px] -bottom-[8px] h-[20px] w-[20px]">
                      <CircleIconButton
                        color="red"
                        icon={mdiClose}
                        title="Reset"
                        size="20"
                        buttonSize="20"
                        padding="[1px]"
                        disableHover
                        class="absolute  left-1/2 top-1/2 translate-x-[-50%] translate-y-[-50%]"
                        on:click={() => handleRemoveFace(face)}
                      />
                    </div>
                  {/if}
                  <div class="absolute -right-[8px] -top-[8px] h-[20px] w-[20px]">
                    {#if selectedPersonToCreate[face.id] || selectedPersonToReassign[face.id]}
                      <CircleIconButton
                        color="blue"
                        icon={mdiRestart}
                        title="Reset"
                        size="20"
                        buttonSize="20"
                        padding="[1px]"
                        disableHover
                        class="absolute  left-1/2 top-1/2 translate-x-[-50%] translate-y-[-50%]"
                        on:click={() => handleReset(face.id)}
                      />
                    {:else}
                      <CircleIconButton
                        color="blue"
                        icon={mdiMinus}
                        title="Select new face"
                        size="20"
                        buttonSize="20"
                        disableHover
                        padding="[1px]"
                        class="absolute left-1/2 top-1/2 translate-x-[-50%] translate-y-[-50%] transform"
                        on:click={() => handleFacePicker(face)}
                      />
                    {/if}
                  </div>
                </div>
              </div>
            {/if}
          {/each}
        {/if}
      </div>
    </div>
  {:else}
    <div class="flex items-center justify-center">
      <div class="grid place-items-center">
        <Icon path={mdiAccountOff} size="3.5em" />
        <p class="mt-5 font-medium">No visible faces</p>
      </div>
    </div>
  {/if}
  <div class="px-4 py-4 text-sm">
    {#if Object.keys(selectedPersonToAdd).length > 0}
      <div class="mt-8">
        <p>Faces to add</p>
        <div class="mt-4 flex flex-wrap gap-2">
          {#each Object.entries(selectedPersonToAdd) as [_, face], index}
            {#if face}
              <div class="relative z-[20001] h-[115px] w-[95px]">
                <div
                  role="button"
                  tabindex={index}
                  class="absolute left-0 top-0 h-[90px] w-[90px] cursor-default"
                  on:focus={() => ($boundingBoxesArray = [face])}
                  on:mouseover={() => ($boundingBoxesArray = [face])}
                  on:mouseleave={() => ($boundingBoxesArray = [])}
                >
                  <div class="relative">
                    <ImageThumbnail
                      curve
                      shadow
                      url={face.person ? getPeopleThumbnailUrl(face.person.id) : face.customThumbnail}
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

                  <div class="absolute -right-[8px] -top-[8px] h-[20px] w-[20px]">
                    <CircleIconButton
                      color="red"
                      icon={mdiMinus}
                      title="Reset"
                      size="20"
                      buttonSize="20"
                      padding="[1px]"
                      disableHover
                      class="absolute  left-1/2 top-1/2 translate-x-[-50%] translate-y-[-50%]"
                      on:click={() => handleRemoveAddedFace(face)}
                    />
                  </div>
                </div>
              </div>
            {/if}
          {/each}
        </div>
      </div>
    {/if}
  </div>
</section>

{#if showSelectedFaces}
  <AssignFaceSidePanel
    {editedFace}
    {allPeople}
    {editedPerson}
    {assetType}
    {assetId}
    onClose={() => (showSelectedFaces = false)}
    onCreatePerson={handleCreatePerson}
    onReassign={handleReassignFace}
  />
{/if}

{#if showUnassignedFaces}
  <UnassignedFacesSidePanel
    {assetType}
    {assetId}
    {allPeople}
    {unassignedFaces}
    {selectedPersonToAdd}
    {selectedFaceToRemove}
    onResetFacesToBeRemoved={() => (selectedFaceToRemove = selectedFaceToRemove)}
    onClose={() => (showUnassignedFaces = false)}
    onCreatePerson={handleCreateOrReassignFaceFromUnassignedFace}
    onReassign={handleCreateOrReassignFaceFromUnassignedFace}
    onAbortRemove={handleAbortRemove}
  />
{/if}
