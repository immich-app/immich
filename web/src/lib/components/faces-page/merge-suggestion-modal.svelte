<script lang="ts">
  import FullScreenModal from '$lib/components/shared-components/full-screen-modal.svelte';
  import { api, type PersonResponseDto } from '@api';
  import { createEventDispatcher } from 'svelte';
  import ImageThumbnail from '../assets/thumbnail/image-thumbnail.svelte';
  import Button from '../elements/buttons/button.svelte';
  import CircleIconButton from '../elements/buttons/circle-icon-button.svelte';
  import { mdiArrowLeft, mdiClose, mdiMerge } from '@mdi/js';
  import Icon from '$lib/components/elements/icon.svelte';

  const dispatch = createEventDispatcher<{
    reject: void;
    confirm: [PersonResponseDto, PersonResponseDto];
    close: void;
  }>();

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

<FullScreenModal on:clickOutside={() => dispatch('close')}>
  <div class="flex h-full w-full place-content-center place-items-center overflow-hidden">
    <div
      class="w-[250px] max-w-[125vw] rounded-3xl border bg-immich-bg shadow-sm dark:border-immich-dark-gray dark:bg-immich-dark-gray dark:text-immich-dark-fg md:w-[375px]"
    >
      <div class="relative flex items-center justify-between">
        <h1 class="truncate px-4 py-4 font-medium text-immich-primary dark:text-immich-dark-primary">
          Merge People - {title}
        </h1>
        <div class="p-2">
          <CircleIconButton icon={mdiClose} on:click={() => dispatch('close')} />
        </div>
      </div>

      <div class="flex items-center justify-center px-2 py-4 md:h-36 md:px-4 md:py-4">
        {#if !choosePersonToMerge}
          <div class="flex h-20 w-20 items-center px-1 md:h-24 md:w-24 md:px-2">
            <ImageThumbnail
              circle
              shadow
              url={api.getPeopleThumbnailUrl(personMerge1.id)}
              altText={personMerge1.name}
              widthStyle="100%"
            />
          </div>
          <div class="mx-0.5 flex md:mx-2">
            <CircleIconButton
              icon={mdiMerge}
              on:click={() => ([personMerge1, personMerge2] = [personMerge2, personMerge1])}
            />
          </div>

          <button
            disabled={potentialMergePeople.length === 0}
            class="flex h-28 w-28 items-center rounded-full border-2 border-immich-primary px-1 dark:border-immich-dark-primary md:h-32 md:w-32 md:px-2"
            on:click={() => {
              if (potentialMergePeople.length > 0) {
                choosePersonToMerge = !choosePersonToMerge;
              }
            }}
          >
            <ImageThumbnail
              border={potentialMergePeople.length > 0}
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
              <button on:click={() => (choosePersonToMerge = false)}> <Icon path={mdiArrowLeft} /></button>
            </div>
            <div class="flex items-center justify-center">
              <div class="flex flex-wrap justify-center md:grid md:grid-cols-{potentialMergePeople.length}">
                {#each potentialMergePeople as person (person.id)}
                  <div class="h-24 w-24 md:h-28 md:w-28">
                    <button class="p-2" on:click={() => changePersonToMerge(person)}>
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
          </div>
        {/if}
      </div>

      <div class="flex px-4 md:px-8 md:pt-4">
        <h1 class="text-xl text-gray-500 dark:text-gray-300">Are these the same person?</h1>
      </div>
      <div class="flex px-4 pt-2 md:px-8">
        <p class="text-sm text-gray-500 dark:text-gray-300">They will be merged together</p>
      </div>
      <div class="mt-8 flex w-full gap-4 px-4 pb-4">
        <Button color="gray" fullwidth on:click={() => dispatch('reject')}>No</Button>
        <Button fullwidth on:click={() => dispatch('confirm', [personMerge1, personMerge2])}>Yes</Button>
      </div>
    </div>
  </div>
</FullScreenModal>
