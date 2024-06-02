<script lang="ts">
  import Icon from '$lib/components/elements/icon.svelte';
  import FullScreenModal from '$lib/components/shared-components/full-screen-modal.svelte';
  import { getPeopleThumbnailUrl } from '$lib/utils';
  import { type PersonResponseDto } from '@immich/sdk';
  import { mdiArrowLeft, mdiMerge } from '@mdi/js';
  import { createEventDispatcher } from 'svelte';
  import ImageThumbnail from '../assets/thumbnail/image-thumbnail.svelte';
  import Button from '../elements/buttons/button.svelte';
  import CircleIconButton from '../elements/buttons/circle-icon-button.svelte';

  export let personMerge1: PersonResponseDto;
  export let personMerge2: PersonResponseDto;
  export let potentialMergePeople: PersonResponseDto[];

  let choosePersonToMerge = false;

  const title = personMerge2.name;

  const dispatch = createEventDispatcher<{
    reject: void;
    confirm: [PersonResponseDto, PersonResponseDto];
    close: void;
  }>();

  const changePersonToMerge = (newperson: PersonResponseDto) => {
    const index = potentialMergePeople.indexOf(newperson);
    [potentialMergePeople[index], personMerge2] = [personMerge2, potentialMergePeople[index]];
    choosePersonToMerge = false;
  };
</script>

<FullScreenModal title="Merge people - {title}" onClose={() => dispatch('close')}>
  <div class="flex items-center justify-center py-4 md:h-36 md:py-4">
    {#if !choosePersonToMerge}
      <div class="flex h-20 w-20 items-center px-1 md:h-24 md:w-24 md:px-2">
        <ImageThumbnail
          circle
          shadow
          url={getPeopleThumbnailUrl(personMerge1.id)}
          altText={personMerge1.name}
          widthStyle="100%"
        />
      </div>
      <div class="mx-0.5 flex md:mx-2">
        <CircleIconButton
          title="Swap merge direction"
          icon={mdiMerge}
          on:click={() => ([personMerge1, personMerge2] = [personMerge2, personMerge1])}
        />
      </div>

      <button
        type="button"
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
          url={getPeopleThumbnailUrl(personMerge2.id)}
          altText={personMerge2.name}
          widthStyle="100%"
        />
      </button>
    {:else}
      <div class="grid w-full grid-cols-1 gap-2">
        <div class="px-2">
          <button type="button" on:click={() => (choosePersonToMerge = false)}> <Icon path={mdiArrowLeft} /></button>
        </div>
        <div class="flex items-center justify-center">
          <div class="flex flex-wrap justify-center md:grid md:grid-cols-{potentialMergePeople.length}">
            {#each potentialMergePeople as person (person.id)}
              <div class="h-24 w-24 md:h-28 md:w-28">
                <button type="button" class="p-2 w-full" on:click={() => changePersonToMerge(person)}>
                  <ImageThumbnail
                    border={true}
                    circle
                    shadow
                    url={getPeopleThumbnailUrl(person.id)}
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

  <div class="flex px-4 md:pt-4">
    <h1 class="text-xl text-gray-500 dark:text-gray-300">Are these the same person?</h1>
  </div>
  <div class="flex px-4 pt-2">
    <p class="text-sm text-gray-500 dark:text-gray-300">They will be merged together</p>
  </div>
  <svelte:fragment slot="sticky-bottom">
    <Button fullwidth color="gray" on:click={() => dispatch('reject')}>No</Button>
    <Button fullwidth on:click={() => dispatch('confirm', [personMerge1, personMerge2])}>Yes</Button>
  </svelte:fragment>
</FullScreenModal>
