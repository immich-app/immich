<script lang="ts">
  import { getPeopleThumbnailUrl } from '$lib/utils';
  import { type PersonResponseDto } from '@immich/sdk';
  import { createEventDispatcher } from 'svelte';
  import ImageThumbnail from '../assets/thumbnail/image-thumbnail.svelte';
  import { fade } from 'svelte/transition';

  export let person: PersonResponseDto;
  export let selectable = false;
  export let selected = false;
  export let thumbnailSize: number | null = null;
  export let circle = false;
  export let border = false;
  export let showName = true;
  export let tooltip = false;

  if (showName) {
    tooltip = false;
  }

  let showNameTooltip = false;

  let dispatch = createEventDispatcher<{
    click: PersonResponseDto;
  }>();

  const handleOnClicked = () => {
    dispatch('click', person);
  };
</script>

<button
  class="relative rounded-lg transition-all"
  on:click={handleOnClicked}
  disabled={!selectable}
  style:width={thumbnailSize ? thumbnailSize + 'px' : '100%'}
  style:height={thumbnailSize ? thumbnailSize + 'px' : '100%'}
  on:mouseenter={() => (showNameTooltip = true)}
  on:mouseleave={() => (showNameTooltip = false)}
>
  <div
    class="h-full w-full border-2 brightness-90 filter"
    class:rounded-full={circle}
    class:rounded-lg={!circle}
    class:border-transparent={!border}
    class:dark:border-immich-dark-primary={border}
    class:border-immich-primary={border}
  >
    <ImageThumbnail {circle} url={getPeopleThumbnailUrl(person.id)} altText={person.name} widthStyle="100%" shadow />
  </div>

  <div
    class="absolute left-0 top-0 h-full w-full bg-immich-primary/30 opacity-0"
    class:hover:opacity-100={selectable}
    class:rounded-full={circle}
    class:rounded-lg={!circle}
  />

  {#if selected}
    <div
      class="absolute left-0 top-0 h-full w-full bg-blue-500/80"
      class:rounded-full={circle}
      class:rounded-lg={!circle}
    />
  {/if}

  {#if showName && person.name}
    <span
      class="w-100 text-white-shadow absolute bottom-2 left-0 w-full text-ellipsis px-1 text-center font-medium text-white hover:cursor-pointer"
    >
      {person.name}
    </span>
  {/if}

  {#if tooltip && person.name && showNameTooltip}
    <div class="absolute inset-x-0 -bottom-4 z-10">
      <div
        class="flex place-content-center place-items-center whitespace-nowrap text-wrap rounded-xl border bg-immich-bg px-1 py-1 text-xs text-immich-fg shadow-lg dark:border-immich-dark-gray dark:bg-gray-600 dark:text-immich-dark-fg"
        class:hidden={!showNameTooltip}
        transition:fade={{ duration: 200 }}
      >
        {person.name}
      </div>
    </div>
  {/if}
</button>
