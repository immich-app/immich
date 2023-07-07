<script lang="ts">
  import { api, type PersonResponseDto } from '@api';
  import ImageThumbnail from '../assets/thumbnail/image-thumbnail.svelte';
  import { createEventDispatcher } from 'svelte';

  export let person: PersonResponseDto;
  export let selectable = false;
  export let selected = false;
  export let thumbnailSize: number | null = null;
  export let circle = false;

  let dispatch = createEventDispatcher();

  const handleOnClicked = () => {
    dispatch('click', person);
  };
</script>

<button
  class="relative transition-all rounded-lg"
  on:click={handleOnClicked}
  disabled={!selectable}
  style:width={thumbnailSize ? thumbnailSize + 'px' : '100%'}
  style:height={thumbnailSize ? thumbnailSize + 'px' : '100%'}
>
  <div class="rounded-xl filter w-full h-full brightness-90">
    <ImageThumbnail {circle} url={api.getPeopleThumbnailUrl(person.id)} altText={person.name} widthStyle="100%" />
  </div>

  <div
    class="absolute top-0 left-0 w-full h-full bg-immich-primary/30 opacity-0 rounded-lg"
    class:hover:opacity-100={selectable}
  />

  {#if selected}
    <div
      class="absolute top-0 left-0 w-full h-full bg-green-900/75"
      class:rounded-full={circle}
      class:rounded-lg={!circle}
    />
  {/if}

  {#if person.name}
    <span
      class="absolute bottom-2 left-0 w-full text-center font-medium text-white text-ellipsis w-100 px-1 hover:cursor-pointer backdrop-blur-[1px]"
    >
      {person.name}
    </span>
  {/if}
</button>
