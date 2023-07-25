<script lang="ts">
  import CircleIconButton from '../elements/buttons/circle-icon-button.svelte';
  import { createEventDispatcher } from 'svelte';
  import Close from 'svelte-material-icons/Close.svelte';
  import ImageThumbnail from '../assets/thumbnail/image-thumbnail.svelte';
  import type { PersonResponseDto } from '../../../api/open-api';
  import { api } from '@api';
  import Merge from 'svelte-material-icons/Merge.svelte';
  import Button from '../elements/buttons/button.svelte';
  import ArrowLeft from 'svelte-material-icons/ArrowLeft.svelte';
  const dispatch = createEventDispatcher();

  export let personMerge1: PersonResponseDto;
  export let personMerge2: PersonResponseDto;
  export let potentialMergePeople: PersonResponseDto[];

  let choosePersonToMerge = false;

  const title = personMerge2.name;

  const changePersonToMerge = (newperson: PersonResponseDto) => {
    const index = potentialMergePeople.indexOf(newperson);
    [potentialMergePeople[index], personMerge2] = [personMerge2, potentialMergePeople[index]];
    choosePersonToMerge = false;
  };
</script>

<div class="absolute z-[99999] h-full w-full">
  <div class="flex h-full w-full place-content-center place-items-center overflow-hidden bg-black/50">
    <div
      class="w-[250px] max-w-[125vw] rounded-3xl border bg-immich-bg shadow-sm dark:border-immich-dark-gray dark:bg-immich-dark-gray dark:text-immich-dark-fg md:w-[350px]"
    >
      <div class="relative flex items-center justify-between">
        <h1 class="truncate px-4 py-4 font-medium text-immich-primary dark:text-immich-dark-primary">
          Merge faces - {title}
        </h1>
        <CircleIconButton logo={Close} on:click={() => dispatch('close')} />
      </div>

      <div class="flex items-center justify-center px-2 py-4 md:h-36 md:px-4 md:py-4">
        {#if !choosePersonToMerge}
          <div class="flex h-28 w-28 items-center md:px-2">
            <ImageThumbnail
              circle
              shadow
              url={api.getPeopleThumbnailUrl(personMerge1.id)}
              altText={personMerge1.name}
              widthStyle="100%"
            />
          </div>
          <div class="flex md:mx-2">
            <CircleIconButton
              logo={Merge}
              on:click={() => ([personMerge1, personMerge2] = [personMerge2, personMerge1])}
            />
          </div>

          <button
            class="flex h-28 w-28 items-center md:px-2"
            on:click={() => {
              if (potentialMergePeople.length > 0) {
                choosePersonToMerge = !choosePersonToMerge;
              }
            }}
          >
            <ImageThumbnail
              border={potentialMergePeople.length > 0 ? true : false}
              circle
              shadow
              url={api.getPeopleThumbnailUrl(personMerge2.id)}
              altText={personMerge2.name}
              widthStyle="100%"
            />
          </button>
        {:else}
          <div class="grid w-full grid-cols-1 gap-2">
            <div class="px-2">
              <button on:click={() => (choosePersonToMerge = false)}> <ArrowLeft /></button>
            </div>
            <div
              class="grid grid-cols-2 place-items-center gap-4 md:grid-cols-{potentialMergePeople.length == 2
                ? '2'
                : '3'} justify-self-center"
            >
              {#each potentialMergePeople as person (person.id)}
                <div class="h-20 w-20 md:h-28 md:w-28 md:p-2">
                  <button on:click={() => changePersonToMerge(person)}>
                    <ImageThumbnail
                      border={true}
                      circle
                      shadow
                      url={api.getPeopleThumbnailUrl(person.id)}
                      altText={person.name}
                      widthStyle="100%"
                      on:click={() => changePersonToMerge(person)}
                    />
                  </button>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>

      <div class="flex px-4 md:px-8 md:pt-4">
        <h1 class="text-xl text-gray-500 dark:text-gray-300">Are these the same face?</h1>
      </div>
      <div class="flex px-4 pt-2 md:px-8">
        <p class="text-sm text-gray-500 dark:text-gray-300">They will be merged together</p>
      </div>
      <div class="mt-8 flex w-full gap-4 px-4 pb-4">
        <Button color="gray" fullwidth on:click={() => dispatch('differentFaces')}>No</Button>
        <Button fullwidth on:click={() => dispatch('mergeFaces')}>Yes</Button>
      </div>
    </div>
  </div>
</div>
