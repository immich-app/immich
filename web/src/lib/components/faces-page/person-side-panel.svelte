<script lang="ts">
  import LoadingSpinner from '$lib/components/shared-components/loading-spinner.svelte';
  import { timeBeforeShowLoadingSpinner } from '$lib/constants';
  import { boundingBoxesArray } from '$lib/stores/people.store';
  import { websocketEvents } from '$lib/stores/websocket';
  import { getPeopleThumbnailUrl, handlePromiseError } from '$lib/utils';
  import { handleError } from '$lib/utils/handle-error';
  import { getPersonNameWithHiddenValue } from '$lib/utils/person';
  import {
    createPerson,
    getAllPeople,
    getFaces,
    reassignFacesById,
    AssetTypeEnum,
    type AssetFaceResponseDto,
    type PersonResponseDto,
  } from '@immich/sdk';
  import { mdiAccountOff } from '@mdi/js';
  import Icon from '$lib/components/elements/icon.svelte';
  import { mdiArrowLeftThin, mdiMinus, mdiRestart } from '@mdi/js';
  import { onMount } from 'svelte';
  import { linear } from 'svelte/easing';
  import { fly } from 'svelte/transition';
  import ImageThumbnail from '../assets/thumbnail/image-thumbnail.svelte';
  import { NotificationType, notificationController } from '../shared-components/notification/notification';
  import AssignFaceSidePanel from './assign-face-side-panel.svelte';
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import { zoomImageToBase64 } from '$lib/utils/people-utils';
  import { photoViewer } from '$lib/stores/assets.store';
  import { t } from 'svelte-i18n';

  export let assetId: string;
  export let assetType: AssetTypeEnum;
  export let onClose: () => void;
  export let onRefresh: () => void;

  // keep track of the changes
  let peopleToCreate: string[] = [];
  let assetFaceGenerated: string[] = [];

  // faces
  let peopleWithFaces: AssetFaceResponseDto[] = [];
  let selectedPersonToReassign: Record<string, PersonResponseDto> = {};
  let selectedPersonToCreate: Record<string, string> = {};
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

  async function loadPeople() {
    const timeout = setTimeout(() => (isShowLoadingPeople = true), timeBeforeShowLoadingSpinner);
    try {
      const { people } = await getAllPeople({ withHidden: true });
      allPeople = people;
      peopleWithFaces = await getFaces({ id: assetId });
    } catch (error) {
      handleError(error, $t('errors.cant_get_faces'));
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
          message: $t('people_edits_count', { values: { count: numberOfChanges } }),
          type: NotificationType.Info,
        });
      } catch (error) {
        handleError(error, $t('errors.cant_apply_changes'));
      }
    }

    isShowLoadingDone = false;
    if (peopleToCreate.length === 0) {
      clearTimeout(loaderLoadingDoneTimeout);
      onRefresh();
    } else {
      automaticRefreshTimeout = setTimeout(onRefresh, 15_000);
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
    editedFace = face;
    showSelectedFaces = true;
  };
</script>

<section
  transition:fly={{ x: 360, duration: 100, easing: linear }}
  class="absolute top-0 z-[2000] h-full w-[360px] overflow-x-hidden p-2 bg-immich-bg dark:bg-immich-dark-bg dark:text-immich-dark-fg"
>
  <div class="flex place-items-center justify-between gap-2">
    <div class="flex items-center gap-2">
      <CircleIconButton icon={mdiArrowLeftThin} title={$t('back')} on:click={onClose} />
      <p class="flex text-lg text-immich-fg dark:text-immich-dark-fg">{$t('edit_faces')}</p>
    </div>
    {#if !isShowLoadingDone}
      <button
        type="button"
        class="justify-self-end rounded-lg p-2 hover:bg-immich-dark-primary hover:dark:bg-immich-dark-primary/50"
        on:click={() => handleEditFaces()}
      >
        {$t('done')}
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
          {@const personName = face.person ? face.person?.name : $t('face_unassigned')}
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
                    altText={$t('new_person')}
                    title={$t('new_person')}
                    widthStyle={thumbnailWidth}
                    heightStyle={thumbnailWidth}
                  />
                {:else if selectedPersonToReassign[face.id]}
                  <ImageThumbnail
                    curve
                    shadow
                    url={getPeopleThumbnailUrl(selectedPersonToReassign[face.id])}
                    altText={selectedPersonToReassign[face.id].name}
                    title={$getPersonNameWithHiddenValue(
                      selectedPersonToReassign[face.id].name,
                      selectedPersonToReassign[face.id]?.isHidden,
                    )}
                    widthStyle={thumbnailWidth}
                    heightStyle={thumbnailWidth}
                    hidden={selectedPersonToReassign[face.id].isHidden}
                  />
                {:else if face.person}
                  <ImageThumbnail
                    curve
                    shadow
                    url={getPeopleThumbnailUrl(face.person)}
                    altText={face.person.name}
                    title={$getPersonNameWithHiddenValue(face.person.name, face.person.isHidden)}
                    widthStyle={thumbnailWidth}
                    heightStyle={thumbnailWidth}
                    hidden={face.person.isHidden}
                  />
                {:else}
                  {#await zoomImageToBase64(face, assetId, assetType, $photoViewer)}
                    <ImageThumbnail
                      curve
                      shadow
                      url="/src/lib/assets/no-thumbnail.png"
                      altText={$t('face_unassigned')}
                      title={$t('face_unassigned')}
                      widthStyle="90px"
                      heightStyle="90px"
                    />
                  {:then data}
                    <ImageThumbnail
                      curve
                      shadow
                      url={data === null ? '/src/lib/assets/no-thumbnail.png' : data}
                      altText={$t('face_unassigned')}
                      title={$t('face_unassigned')}
                      widthStyle="90px"
                      heightStyle="90px"
                    />
                  {/await}
                {/if}
              </div>

              {#if !selectedPersonToCreate[face.id]}
                <p class="relative mt-1 truncate font-medium" title={personName}>
                  {#if selectedPersonToReassign[face.id]?.id}
                    {selectedPersonToReassign[face.id]?.name}
                  {:else}
                    <span class={personName === $t('face_unassigned') ? 'dark:text-gray-500' : ''}>{personName}</span>
                  {/if}
                </p>
              {/if}

              <div class="absolute -right-[5px] -top-[5px] h-[20px] w-[20px] rounded-full">
                {#if selectedPersonToCreate[face.id] || selectedPersonToReassign[face.id]}
                  <CircleIconButton
                    color="primary"
                    icon={mdiRestart}
                    title={$t('reset')}
                    size="18"
                    padding="1"
                    class="absolute left-1/2 top-1/2 translate-x-[-50%] translate-y-[-50%] transform"
                    on:click={() => handleReset(face.id)}
                  />
                {:else}
                  <CircleIconButton
                    color="primary"
                    icon={mdiMinus}
                    title={$t('select_new_face')}
                    size="18"
                    padding="1"
                    class="absolute left-1/2 top-1/2 translate-x-[-50%] translate-y-[-50%] transform"
                    on:click={() => handleFacePicker(face)}
                  />
                {/if}
              </div>
              <div class="absolute right-[25px] -top-[5px] h-[20px] w-[20px] rounded-full">
                {#if !selectedPersonToCreate[face.id] && !selectedPersonToReassign[face.id] && !face.person}
                  <div
                    class="flex place-content-center place-items-center rounded-full bg-[#d3d3d3] p-1 transition-all absolute left-1/2 top-1/2 translate-x-[-50%] translate-y-[-50%] transform"
                  >
                    <Icon color="primary" path={mdiAccountOff} ariaHidden size="18" />
                  </div>
                {/if}
              </div>
            </div>
          </div>
        {/each}
      {/if}
    </div>
  </div>
</section>

{#if showSelectedFaces}
  <AssignFaceSidePanel
    {allPeople}
    {editedFace}
    {assetId}
    {assetType}
    onClose={() => (showSelectedFaces = false)}
    onCreatePerson={handleCreatePerson}
    onReassign={handleReassignFace}
  />
{/if}
