<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { api, type PersonResponseDto } from '@api';
  import FaceThumbnail from './face-thumbnail.svelte';
  import { quintOut } from 'svelte/easing';
  import { fly } from 'svelte/transition';
  import ControlAppBar from '../shared-components/control-app-bar.svelte';
  import Button from '../elements/buttons/button.svelte';
  import Merge from 'svelte-material-icons/Merge.svelte';
  import CallMerge from 'svelte-material-icons/CallMerge.svelte';
  import { flip } from 'svelte/animate';
  import { NotificationType, notificationController } from '../shared-components/notification/notification';

  export let person: PersonResponseDto;
  let people: PersonResponseDto[] = [];
  let selectFaces: Set<PersonResponseDto> = new Set();
  let screenHeight: number;
  let dispatch = createEventDispatcher();
  $: hasSelection = selectFaces.size > 0;

  onMount(async () => {
    const { data } = await api.personApi.getAllPeople();
    people = data.filter((p) => p.id !== person.id);
  });

  const onClose = () => {
    dispatch('go-back');
  };

  const onFaceClicked = (person: PersonResponseDto) => {
    if (selectFaces.has(person)) {
      const temp = new Set(selectFaces);
      temp.delete(person);
      selectFaces = temp;
      people = [person, ...people];
    } else {
      if (selectFaces.size >= 5) {
        notificationController.show({
          message: 'You can only merge up to 5 faces at a time',
          type: NotificationType.Info,
        });
        return;
      }
      selectFaces = selectFaces.add(person);
      people = people.filter((p) => p.id !== person.id);
    }
  };
</script>

<svelte:window bind:innerHeight={screenHeight} />

<section
  transition:fly={{ y: 500, duration: 100, easing: quintOut }}
  class="absolute top-0 left-0 w-full h-full bg-immich-bg dark:bg-immich-dark-bg z-[9999]"
>
  <ControlAppBar on:close-button-click={onClose}>
    <svelte:fragment slot="leading">
      {#if hasSelection}
        Selected {selectFaces.size}
      {:else}
        Merge faces
      {/if}
      <div />
    </svelte:fragment>
    <svelte:fragment slot="trailing">
      <Button size={'sm'} disabled={selectFaces.size == 0}>
        <Merge size={18} />
        <span class="ml-2"> Merge</span></Button
      >
    </svelte:fragment>
  </ControlAppBar>
  <section class="pt-[100px] px-[70px] bg-immich-bg dark:bg-immich-dark-bg">
    <section id="merge-face-selector relative">
      <div class="place-items-center place-content-center mb-10 h-[200px]">
        <p class="uppercase mb-4 dark:text-white text-center">Choose matching faces to merge</p>

        <div class="grid grid-flow-col-dense place-items-center place-content-center gap-4">
          {#each Array.from(selectFaces) as person (person.id)}
            <div animate:flip={{ duration: 250, easing: quintOut }}>
              <FaceThumbnail
                border
                circle
                {person}
                selectable
                thumbnailSize={120}
                on:click={() => onFaceClicked(person)}
              />
            </div>
          {/each}

          {#if hasSelection}
            <span><CallMerge size={48} class="rotate-90 dark:text-white" /> </span>
          {/if}
          <FaceThumbnail {person} border circle selectable={false} thumbnailSize={180} />
        </div>
      </div>
      <div
        class="p-10 overflow-y-auto rounded-3xl bg-gray-200 dark:bg-immich-dark-gray"
        style:max-height={screenHeight - 200 - 200 + 'px'}
      >
        <div class="grid grid-col-2 md:grid-cols-3 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-8">
          {#each people as person (person.id)}
            <FaceThumbnail
              {person}
              on:click={() => onFaceClicked(person)}
              selected={selectFaces.has(person)}
              circle
              border
              selectable
            />
          {/each}
        </div>
      </div>
    </section>
  </section>
</section>
