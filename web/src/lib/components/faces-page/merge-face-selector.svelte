<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { api, type PersonResponseDto } from '@api';
  import FaceThumbnail from './face-thumbnail.svelte';
  import { quintOut } from 'svelte/easing';
  import { fly } from 'svelte/transition';
  import ControlAppBar from '../shared-components/control-app-bar.svelte';

  export let person: PersonResponseDto;
  let people: PersonResponseDto[] = [];
  let selectFaces: Set<PersonResponseDto> = new Set();
  let screenHeight: number;
  let dispatch = createEventDispatcher();

  onMount(async () => {
    const { data } = await api.personApi.getAllPeople();
    people = data.filter((p) => p.id !== person.id);
  });

  const onClose = () => {
    dispatch('go-back');
  };

  const handleOnClicked = (person: PersonResponseDto) => {
    if (selectFaces.has(person)) {
      const temp = new Set(selectFaces);
      temp.delete(person);
      selectFaces = temp;
    } else {
      selectFaces = selectFaces.add(person);
    }
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
  <section class="pt-[100px] px-[70px] bg-immich-bg dark:bg-immich-dark-bg">
    <section id="merge-face-selector relative">
      <div class="flex flex-col place-items-center place-content-center mb-10 h-[200px]">
        <p class="uppercase mb-4 dark:text-white">Choose matching faces with</p>

        <div class="grid grid-flow-col-dense place-items-center gap-4">
          {#each Array.from(selectFaces) as person (person.id)}
            <FaceThumbnail {person} selectable={false} thumbnailSize={120} />
            <span class="text-2xl font-medium dark:text-white">+</span>
          {/each}
          <FaceThumbnail {person} selectable={false} thumbnailSize={180} />
        </div>
      </div>
      <div
        class="p-4 overflow-y-scroll rounded-xl bg-gray-200 dark:bg-immich-dark-gray"
        style:height={screenHeight - 200 - 200 + 'px'}
      >
        <div class="grid grid-col-2 md:grid-cols-3 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-12 gap-4">
          {#each people as person (person.id)}
            <FaceThumbnail
              {person}
              selectable={true}
              on:click={() => handleOnClicked(person)}
              selected={selectFaces.has(person)}
            />
          {/each}
        </div>
      </div>
    </section>
  </section>
</section>
