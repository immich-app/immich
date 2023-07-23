<script lang="ts">
  import CircleIconButton from '../elements/buttons/circle-icon-button.svelte';
  import { createEventDispatcher } from 'svelte';
  import Close from 'svelte-material-icons/Close.svelte';
  import ImageThumbnail from '../assets/thumbnail/image-thumbnail.svelte';
  import type { PersonResponseDto } from '../../../api/open-api';
  import { api } from '@api';
  import Merge from 'svelte-material-icons/Merge.svelte';
  import Button from '../elements/buttons/button.svelte';
  const dispatch = createEventDispatcher();

  export let person1: PersonResponseDto;
  export let person2: PersonResponseDto;

  const invert = () => {
    let temp: PersonResponseDto = person1;
    person1 = person2;
    person2 = temp;
  };
</script>

<div class="absolute z-[99999] h-full w-full">
  <div class="flex h-full w-full place-content-center place-items-center overflow-hidden bg-black/50">
    <div
      class="w-[200px] max-w-[125vw] rounded-3xl border bg-immich-bg shadow-sm dark:border-immich-dark-gray dark:bg-immich-dark-gray dark:text-immich-dark-fg md:w-[350px]"
    >
      <div class="relative">
        <h1 class="px-8 py-8 font-medium text-immich-primary dark:text-immich-dark-primary">Merge faces</h1>
        <div class="absolute inset-y-0 right-0 px-4 py-4">
          <CircleIconButton logo={Close} on:click={() => dispatch('close')} />
        </div>
      </div>

      <div class="flex items-center justify-center px-4 pb-4">
        <div class="h-28 w-28 px-2">
          <ImageThumbnail
            circle
            shadow
            url={api.getPeopleThumbnailUrl(person1.id)}
            altText={person1.name}
            widthStyle="100%"
          />
        </div>
        <div class="mx-2 flex">
          <CircleIconButton
            logo={Merge}
            on:click={() => {
              invert();
            }}
          />
        </div>
        <div class="h-28 w-28 px-2">
          <ImageThumbnail
            circle
            shadow
            url={api.getPeopleThumbnailUrl(person2.id)}
            altText={person2.name}
            widthStyle="100%"
          />
        </div>
      </div>
      <div class="flex px-8 pt-4">
        <h1 class="text-xl text-gray-500 dark:text-gray-300">Are these the same face?</h1>
      </div>
      <div class="flex px-8 pt-2">
        <p class="text-sm text-gray-500 dark:text-gray-300">They will be merged together</p>
      </div>
      <div class="mt-8 flex w-full gap-4 px-4 pb-4">
        <Button color="gray" fullwidth on:click={() => dispatch('differentFaces')}>No</Button>
        <Button fullwidth on:click={() => dispatch('mergeFaces')}>Yes</Button>
      </div>
    </div>
  </div>
</div>
