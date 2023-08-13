<script lang="ts">
  import IntersectionObserver from '$lib/components/asset-viewer/intersection-observer.svelte';
  import { api, PersonResponseDto } from '@api';
  import { createEventDispatcher } from 'svelte';
  import CheckCircle from 'svelte-material-icons/CheckCircle.svelte';

  import { fade } from 'svelte/transition';
  import ImageThumbnail from './image-thumbnail.svelte';

  export let person: PersonResponseDto;
  export let groupIndex = 0;
  export let thumbnailSize: number | undefined = undefined;
  export let thumbnailWidth: number | undefined = undefined;
  export let thumbnailHeight: number | undefined = undefined;
  export let selected = false;
  export let selectionCandidate = false;
  export let disabled = false;
  export let readonly = false;

  let mouseOver = false;

  const dispatch = createEventDispatcher<{
    click: { person: PersonResponseDto };
    select: { person: PersonResponseDto };
    'mouse-event': { isMouseOver: boolean; selectedGroupIndex: number };
  }>();

  $: dispatch('mouse-event', { isMouseOver: mouseOver, selectedGroupIndex: groupIndex });

  $: [width, height] = ((): [number, number] => {
    if (thumbnailSize) {
      return [thumbnailSize, thumbnailSize];
    }

    if (thumbnailWidth && thumbnailHeight) {
      return [thumbnailWidth, thumbnailHeight];
    }

    return [235, 235];
  })();

  const thumbnailClickedHandler = () => {
    if (!disabled) {
      dispatch('click', { person });
    }
  };

  const thumbnailKeyDownHandler = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      thumbnailClickedHandler();
    }
  };

  const onIconClickedHandler = (e: MouseEvent) => {
    e.stopPropagation();
    if (!disabled) {
      dispatch('select', { person });
    }
  };
</script>

<IntersectionObserver once={false} let:intersecting>
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div
    style:width="{width}px"
    style:height="{height}px"
    class="group relative overflow-hidden {disabled
      ? 'bg-gray-300'
      : 'bg-immich-primary/20 dark:bg-immich-dark-primary/20'}"
    class:cursor-not-allowed={disabled}
    class:hover:cursor-pointer={!disabled}
    on:mouseenter={() => (mouseOver = true)}
    on:mouseleave={() => (mouseOver = false)}
    on:click={thumbnailClickedHandler}
    on:keydown={thumbnailKeyDownHandler}
  >
    {#if intersecting}
      <div class="absolute z-20 h-full w-full">
        <!-- Select asset button  -->
        {#if !readonly && (mouseOver || selected || selectionCandidate)}
          <button
            on:click={onIconClickedHandler}
            class="absolute p-2 focus:outline-none"
            class:cursor-not-allowed={disabled}
            role="checkbox"
            aria-checked={selected}
            {disabled}
          >
            {#if disabled}
              <CheckCircle size="24" class="text-zinc-800" />
            {:else if selected}
              <div class="rounded-full bg-[#D9DCEF] dark:bg-[#232932]">
                <CheckCircle size="24" class="text-immich-primary" />
              </div>
            {:else}
              <CheckCircle size="24" class="text-white/80 hover:text-white" />
            {/if}
          </button>
        {/if}
      </div>

      <div
        class="dark:bg-immich-dark-gray absolute h-full w-full select-none bg-gray-100 transition-transform"
        class:scale-[0.85]={selected}
        class:rounded-xl={selected}
      >
        <!-- Gradient overlay on hover -->
        <div
          class="absolute z-10 h-full w-full bg-gradient-to-b from-black/25 via-[transparent_25%] opacity-0 transition-opacity group-hover:opacity-100"
          class:rounded-xl={selected}
        />

        <ImageThumbnail
          url={api.getPeopleThumbnailUrl(person.id)}
          altText={person.name}
          widthStyle="{width}px"
          heightStyle="{height}px"
          curve={selected}
        />
      </div>
      {#if selectionCandidate}
        <div
          class="bg-immich-primary absolute top-0 h-full w-full opacity-40"
          in:fade={{ duration: 100 }}
          out:fade={{ duration: 100 }}
        />
      {/if}
    {/if}
  </div>
</IntersectionObserver>
