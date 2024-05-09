<script lang="ts">
  import LoadingSpinner from '$lib/components/shared-components/loading-spinner.svelte';
  import { timeBeforeShowLoadingSpinner } from '$lib/constants';
  import { boundingBoxesArray } from '$lib/stores/people.store';
  import { websocketEvents } from '$lib/stores/websocket';
  import { getPeopleThumbnailUrl, handlePromiseError } from '$lib/utils';
  import { handleError } from '$lib/utils/handle-error';
  import { getPersonNameWithHiddenValue } from '$lib/utils/person';
  import {
    AssetTypeEnum,
    createPerson,
    getAllPeople,
    getFaces,
    reassignFacesById,
    type AssetFaceResponseDto,
    type PersonResponseDto,
  } from '@immich/sdk';
  import { mdiArrowLeftThin, mdiMinus, mdiRestart } from '@mdi/js';
  import { createEventDispatcher, onMount } from 'svelte';
  import { linear } from 'svelte/easing';
  import { fly } from 'svelte/transition';
  import ImageThumbnail from '../assets/thumbnail/image-thumbnail.svelte';
  import { NotificationType, notificationController } from '../shared-components/notification/notification';
  import AssignFaceSidePanel from './assign-face-side-panel.svelte';
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';

  export let assetId: string;
  export let assetType: AssetTypeEnum;

  // keep track of the changes
  let peopleToCreate: string[] = [];
  let assetFaceGenerated: string[] = [];

  // faces
  let peopleWithFaces: AssetFaceResponseDto[] = [];
  let selectedPersonToReassign: Record<string, PersonResponseDto> = {};
  let selectedPersonToCreate: Record<string, string> = {};
  let editedPerson: PersonResponseDto;
  let editedFace: AssetFaceResponseDto;

  // loading spinners
  let isShowLoadingDone = false;
  let isShowLoadingPeople = false;

  // search people
  let showSelectedFaces = false;
  let allPeople: PersonResponseDto[] = [];

  // timers
  let loaderLoadingDoneTimeout: ReturnType<typeof setTimeout>;
  let automaticRefreshTimeout: ReturnType<typeof setTimeout>;

  const thumbnailWidth = '90px';

  const dispatch = createEventDispatcher<{
    close: void;
    refresh: void;
  }>();

  async function loadPeople() {
    const timeout = setTimeout(() => (isShowLoadingPeople = true), timeBeforeShowLoadingSpinner);
    try {
      const { people } = await getAllPeople({ withHidden: true });
      allPeople = people;
      peopleWithFaces = await getFaces({ id: assetId });
    } catch (error) {
      handleError(error, "Can't get faces");
    } finally {
      clearTimeout(timeout);
    }
    isShowLoadingPeople = false;
  }

  const onPersonThumbnail = (personId: string) => {
    assetFaceGenerated.push(personId);
    if (
      isEqual(assetFaceGenerated, peopleToCreate) &&
      loaderLoadingDoneTimeout &&
      automaticRefreshTimeout &&
      Object.keys(selectedPersonToCreate).length === peopleToCreate.length
    ) {
      clearTimeout(loaderLoadingDoneTimeout);
      clearTimeout(automaticRefreshTimeout);
      dispatch('refresh');
    }
  };

  onMount(() => {
    handlePromiseError(loadPeople());
    return websocketEvents.on('on_person_thumbnail', onPersonThumbnail);
  });

  const isEqual = (a: string[], b: string[]): boolean => {
    return b.every((valueB) => a.includes(valueB));
  };

  const handleBackButton = () => {
    dispatch('close');
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

  const handleEditFaces = async () => {
    loaderLoadingDoneTimeout = setTimeout(() => (isShowLoadingDone = true), timeBeforeShowLoadingSpinner);
    const numberOfChanges = Object.keys(selectedPersonToCreate).length + Object.keys(selectedPersonToReassign).length;

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
      dispatch('refresh');
    } else {
      automaticRefreshTimeout = setTimeout(() => dispatch('refresh'), 15_000);
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
</script>

<section
  transition:fly={{ x: 360, duration: 100, easing: linear }}
  class="absolute top-0 z-[2000] h-full w-[360px] overflow-x-hidden p-2 bg-immich-bg dark:bg-immich-dark-bg dark:text-immich-dark-fg"
>
  <div class="flex place-items-center justify-between gap-2">
    <div class="flex items-center gap-2">
      <CircleIconButton icon={mdiArrowLeftThin} title="Back" on:click={handleBackButton} />
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

                <div class="absolute -right-[5px] -top-[5px] h-[20px] w-[20px] rounded-full">
                  {#if selectedPersonToCreate[face.id] || selectedPersonToReassign[face.id]}
                    <CircleIconButton
                      color="primary"
                      icon={mdiRestart}
                      title="Reset"
                      size="18"
                      padding="1"
                      class="absolute left-1/2 top-1/2 translate-x-[-50%] translate-y-[-50%] transform"
                      on:click={() => handleReset(face.id)}
                    />
                  {:else}
                    <CircleIconButton
                      color="primary"
                      icon={mdiMinus}
                      title="Select new face"
                      size="18"
                      padding="1"
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
</section>

{#if showSelectedFaces}
  <AssignFaceSidePanel
    {peopleWithFaces}
    {allPeople}
    {editedPerson}
    {assetType}
    {assetId}
    on:close={() => (showSelectedFaces = false)}
    on:createPerson={(event) => handleCreatePerson(event.detail)}
    on:reassign={(event) => handleReassignFace(event.detail)}
  />
{/if}
