<script lang="ts">
  import { fly } from 'svelte/transition';
  import { linear } from 'svelte/easing';
  import { mdiAccountOff, mdiArrowLeftThin, mdiClose, mdiMinus } from '@mdi/js';
  import type { FaceWithGeneratedThumbnail } from '$lib/utils/people-utils';
  import { boundingBoxesArray } from '$lib/stores/people.store';
  import type { AssetFaceResponseDto, AssetTypeEnum, PersonResponseDto } from '@immich/sdk';
  import ImageThumbnail from '$lib/components/assets/thumbnail/image-thumbnail.svelte';
  import AssignFaceSidePanel from '$lib/components/faces-page/assign-face-side-panel.svelte';
  import Icon from '$lib/components/elements/icon.svelte';
  import { getPeopleThumbnailUrl } from '$lib/utils';
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';

  export let unassignedFaces: FaceWithGeneratedThumbnail[];
  export let allPeople: PersonResponseDto[];
  export let selectedPersonToAdd: Record<string, FaceWithGeneratedThumbnail>;
  export let selectedFaceToRemove: Record<string, AssetFaceResponseDto>;
  export let assetType: AssetTypeEnum;
  export let assetId: string;
  export let onResetFacesToBeRemoved: () => void;
  export let onClose: () => void;
  export let onCreatePerson: (face: FaceWithGeneratedThumbnail) => void;
  export let onReassign: (face: FaceWithGeneratedThumbnail) => void;
  export let onAbortRemove: (id: string) => void;

  let showSelectedFaces = false;
  let editedFace: FaceWithGeneratedThumbnail;

  const handleSelectedFace = (face: FaceWithGeneratedThumbnail) => {
    editedFace = face;
    showSelectedFaces = true;
  };

  const handleCreatePerson = (newFeaturePhoto: string | null) => {
    showSelectedFaces = false;
    if (newFeaturePhoto) {
      editedFace.customThumbnail = newFeaturePhoto;
      onCreatePerson(editedFace);
    } else {
      onClose();
    }
  };

  const handleReassignFace = (person: PersonResponseDto | null) => {
    if (person) {
      showSelectedFaces = false;
      editedFace.person = person;
      onReassign(editedFace);
    } else {
      onClose();
    }
  };

  const handleAbortRemove = (id: string) => {
    delete selectedFaceToRemove[id];
    selectedFaceToRemove = selectedFaceToRemove;
    onAbortRemove(id);
  };

  const handleRemoveAllFaces = () => {
    for (const [id] of Object.entries(selectedFaceToRemove)) {
      delete selectedFaceToRemove[id];
    }

    // trigger reactivity
    selectedFaceToRemove = selectedFaceToRemove;
    onResetFacesToBeRemoved();
  };
</script>

<section
  transition:fly={{ x: 360, duration: 100, easing: linear }}
  class="absolute top-0 z-[2001] h-full w-[360px] overflow-x-hidden p-2 bg-immich-bg dark:bg-immich-dark-bg dark:text-immich-dark-fg"
>
  <div class="flex place-items-center justify-between gap-2">
    <div class="flex items-center gap-2">
      <button
        type="button"
        class="flex place-content-center rounded-full p-3 transition-colors hover:bg-gray-200 dark:text-immich-dark-fg dark:hover:bg-gray-900"
        on:click={onClose}
      >
        <div>
          <Icon path={mdiArrowLeftThin} size="24" />
        </div>
      </button>
      <p class="flex text-lg text-immich-fg dark:text-immich-dark-fg">Faces available</p>
    </div>
  </div>
  {#if unassignedFaces.length > 0 && unassignedFaces.length > Object.keys(selectedPersonToAdd).length}
    <div class="px-4 py-4 text-sm">
      <p>Faces removed</p>
      <div class="mt-4 flex flex-wrap gap-2">
        {#each unassignedFaces as face, index (face.id)}
          {#if !selectedPersonToAdd[face.id]}
            <div class="relative z-[20001] h-[115px] w-[95px]">
              <button
                type="button"
                tabindex={index}
                class="absolute left-0 top-0 h-[90px] w-[90px] cursor-default"
                on:focus={() => ($boundingBoxesArray = [face])}
                on:mouseover={() => ($boundingBoxesArray = [face])}
                on:mouseleave={() => ($boundingBoxesArray = [])}
              >
                <ImageThumbnail
                  curve
                  shadow
                  url={face.customThumbnail}
                  title="Available face"
                  altText="Available face"
                  widthStyle="90px"
                  heightStyle="90px"
                  thumbhash={null}
                />
                <div class="absolute -right-[8px] -top-[8px] h-[20px] w-[20px]">
                  <CircleIconButton
                    color="blue"
                    icon={mdiMinus}
                    title="Reset"
                    size="20"
                    buttonSize="20"
                    padding="[1px]"
                    disableHover
                    class="absolute  left-1/2 top-1/2 translate-x-[-50%] translate-y-[-50%]"
                    on:click={() => handleSelectedFace(face)}
                  />
                </div>
              </button>
            </div>
          {/if}
        {/each}
      </div>
    </div>
  {:else}
    <div class="flex items-center justify-center">
      <div class="grid place-items-center">
        <Icon path={mdiAccountOff} size="3.5em" />
        <p class="mt-5 font-medium">No faces removed</p>
      </div>
    </div>
  {/if}
  {#if Object.keys(selectedFaceToRemove).length > 0}
    <div class="px-4 py-4 text-sm">
      <div class="flex items-center justify-between">
        <p>Faces to be removed</p>
        <button
          type="button"
          class="justify-self-end rounded-lg p-2 hover:bg-immich-dark-primary hover:dark:bg-immich-dark-primary/50"
          on:click={handleRemoveAllFaces}
          title="Reset"
        >
          <div>
            <Icon path={mdiClose} />
          </div>
        </button>
      </div>
      <div class="mt-4 flex flex-wrap gap-2">
        {#each Object.entries(selectedFaceToRemove) as [id, face], index}
          <div class="relative z-[20001] h-[115px] w-[95px]">
            <button
              type="button"
              tabindex={index}
              class="absolute left-0 top-0 h-[90px] w-[90px] cursor-default"
              on:focus={() => (face ? ($boundingBoxesArray = [face]) : '')}
              on:mouseover={() => (face ? ($boundingBoxesArray = [face]) : '')}
              on:mouseleave={() => ($boundingBoxesArray = [])}
            >
              <ImageThumbnail
                curve
                shadow
                url={face.person ? getPeopleThumbnailUrl(face.person?.id) : ''}
                title="Available face"
                altText="Available face"
                widthStyle="90px"
                heightStyle="90px"
                thumbhash={null}
              />
              <div class="absolute -right-[8px] -top-[8px] h-[20px] w-[20px]">
                <CircleIconButton
                  color="blue"
                  icon={mdiClose}
                  title="Reset"
                  size="20"
                  buttonSize="20"
                  padding="[1px]"
                  disableHover
                  class="absolute  left-1/2 top-1/2 translate-x-[-50%] translate-y-[-50%]"
                  on:click={() => handleAbortRemove(id)}
                />
              </div>
            </button>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</section>

{#if showSelectedFaces}
  <AssignFaceSidePanel
    {assetType}
    {assetId}
    {editedFace}
    {allPeople}
    onClose={() => (showSelectedFaces = false)}
    onCreatePerson={handleCreatePerson}
    onReassign={handleReassignFace}
  />
{/if}
