<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import type { PersonResponseDto } from '../../../api/open-api';
  import { api } from '../../../api/api';
  import ImageThumbnail from '../assets/thumbnail/image-thumbnail.svelte';
  import FaceThumbnail from './face-thumbnail.svelte';
  import { assets } from '$app/paths';
  import { quintOut } from 'svelte/easing';
  import { fly } from 'svelte/transition';
  import ControlAppBar from '../shared-components/control-app-bar.svelte';
  import AssetSelectionViewer from '../shared-components/gallery-viewer/asset-selection-viewer.svelte';

  export let person: PersonResponseDto;
  let people: PersonResponseDto[] = [];
  let screenHeight: number;
  let peopleContainerWidth: number;
  let dispatch = createEventDispatcher();
  let facesPerRow = 10;
  onMount(async () => {
    const { data } = await api.personApi.getAllPeople();
    people = data.filter((p) => p.id !== person.id);
  });

  const onClose = () => {
    console.log('go back');
    dispatch('go-back');
  };
</script>

<svelte:window bind:innerHeight={screenHeight} />

<section
  transition:fly={{ y: 500, duration: 100, easing: quintOut }}
  class="absolute top-0 left-0 w-full h-full bg-immich-bg dark:bg-immich-dark-bg z-[9999]"
>
  <ControlAppBar on:close-button-click={onClose}>
    <svelte:fragment slot="leading">Merge faces</svelte:fragment>
  </ControlAppBar>
  <section class="pt-[100px] pl-[70px] bg-immich-bg dark:bg-immich-dark-bg">
    <section id="merge-face-selector relative">
      <div class=" flex flex-col place-items-center place-content-center mb-10 h-[200px]">
        <p class="uppercase mb-4 dark:text-white">Choose matching faces with</p>
        <FaceThumbnail {person} selectable={false} />
      </div>
      <div
        class="pl-4 overflow-y-scroll py-4 rounded-xl mr-18 bg-gray-200 dark:bg-immich-dark-gray"
        style:height={screenHeight - 200 - 200 + 'px'}
        bind:clientWidth={peopleContainerWidth}
      >
        <div class="flex flex-row flex-wrap gap-1">
          {#each people as person (person.id)}
            <FaceThumbnail
              {person}
              selectable={true}
              thumbnailSize={peopleContainerWidth / facesPerRow - facesPerRow + 3}
            />
          {/each}
        </div>
      </div>
    </section>
  </section>
</section>
