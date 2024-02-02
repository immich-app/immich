<script lang="ts">
  import { fly } from 'svelte/transition';
  import { linear } from 'svelte/easing';
  import ImageThumbnail from '../assets/thumbnail/image-thumbnail.svelte';
  import { mdiAccountOff, mdiArrowLeftThin } from '@mdi/js';
  import Icon from '../elements/icon.svelte';
  import { createEventDispatcher } from 'svelte';
  import AssignFaceSidePanel from './assign-face-side-panel.svelte';
  import type { AssetResponseDto, PersonResponseDto } from '@api';
  import type { FaceWithGeneretedThumbnail } from '$lib/utils/people-utils';
  import { boundingBoxesArray } from '$lib/stores/people.store';

  export let unassignedFaces: FaceWithGeneretedThumbnail[];
  export let allPeople: PersonResponseDto[];
  export let selectedPersonToAdd: FaceWithGeneretedThumbnail[];
  export let asset: AssetResponseDto;

  let showSeletecFaces = false;
  let personSelected: FaceWithGeneretedThumbnail;
  const dispatch = createEventDispatcher();
  const handleBackButton = () => {
    dispatch('close');
  };

  const handleSelectedFace = (index: number) => {
    const face = unassignedFaces[index];
    if (face) {
      personSelected = face;
      showSeletecFaces = true;
    }
  };

  const handleCreatePerson = (newFeaturePhoto: string | null) => {
    showSeletecFaces = false;
    if (newFeaturePhoto) {
      personSelected.customThumbnail = newFeaturePhoto;
      dispatch('createPerson', personSelected);
    } else {
      dispatch('close');
    }
  };

  const handleReassignFace = (person: PersonResponseDto | null) => {
    if (person) {
      showSeletecFaces = false;
      personSelected.person = person;
      dispatch('reassign', personSelected);
    } else {
      dispatch('close');
    }
  };
</script>

<section
  transition:fly={{ x: 360, duration: 100, easing: linear }}
  class="absolute top-0 z-[2001] h-full w-[360px] overflow-x-hidden p-2 bg-immich-bg dark:bg-immich-dark-bg dark:text-immich-dark-fg"
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
      <p class="flex text-lg text-immich-fg dark:text-immich-dark-fg">Faces available</p>
    </div>
  </div>
  {#if unassignedFaces.some(Boolean)}
    <div class="px-4 py-4 text-sm">
      <div class="mt-4 flex flex-wrap gap-2">
        {#each unassignedFaces as face, index}
          {#if !selectedPersonToAdd.some((faceToAdd) => face && faceToAdd.id === face.id)}
            <div class="relative z-[20001] h-[115px] w-[95px]">
              <button
                tabindex={index}
                class="absolute left-0 top-0 h-[90px] w-[90px] cursor-default"
                on:focus={() => (face ? ($boundingBoxesArray = [face]) : '')}
                on:mouseover={() => (face ? ($boundingBoxesArray = [face]) : '')}
                on:mouseleave={() => ($boundingBoxesArray = [])}
                on:click={() => handleSelectedFace(index)}
                on:keydown={() => handleSelectedFace(index)}
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
        <p class="mt-5 font-medium">No faces available</p>
      </div>
    </div>
  {/if}
</section>

{#if showSeletecFaces}
  <AssignFaceSidePanel
    {asset}
    personWithFace={personSelected}
    {allPeople}
    on:close={() => (showSeletecFaces = false)}
    on:createPerson={(event) => handleCreatePerson(event.detail)}
    on:reassign={(event) => handleReassignFace(event.detail)}
  />
{/if}
