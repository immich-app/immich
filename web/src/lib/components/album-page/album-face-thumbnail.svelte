<script lang="ts">
  import { getPeopleThumbnailUrl } from '$lib/utils';
  import Icon from '$lib/components/elements/icon.svelte';
  import { mdiCheckCircle } from '@mdi/js';
  import { createEventDispatcher } from 'svelte';
  import { fade } from 'svelte/transition';
  import { shortcut } from '$lib/utils/shortcut';
  import type { PersonResponseDto } from '@immich/sdk';
  import ImageThumbnail from '$lib/components/assets/thumbnail/image-thumbnail.svelte';

  const dispatch = createEventDispatcher<{
    select: { person: PersonResponseDto; selected: boolean };
    'mouse-event': { isMouseOver: boolean; selectedGroupIndex: number };
  }>();

  export let person: PersonResponseDto;
  export let groupIndex = 0;
  export let selected = false;
  export let selectionCandidate = false;
  export let disabled = false;
  export let readonly = false;
  export let onClick: ((person: PersonResponseDto, selected: boolean) => void) | undefined = undefined;

  let className = '';
  export { className as class };

  let mouseOver = false;
  $: clickable = !disabled && onClick;

  $: dispatch('mouse-event', { isMouseOver: mouseOver, selectedGroupIndex: groupIndex });

  const thumbnailClickedHandler = () => {
    if (clickable) {
      onClick?.(person, selected);
    }
  };

  const onIconClickedHandler = (e: MouseEvent) => {
    e.stopPropagation();
    if (!disabled) {
      dispatch('select', { person, selected });
    }
  };

  const onMouseEnter = () => {
    mouseOver = true;
  };

  const onMouseLeave = () => {
    mouseOver = false;
  };
</script>

<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
<div
  class="group focus-visible:outline-none relative overflow-hidden {disabled
    ? 'bg-gray-300'
    : 'bg-immich-primary/20 dark:bg-immich-dark-primary/20'}"
  class:cursor-not-allowed={disabled}
  class:hover:cursor-pointer={clickable}
  on:mouseenter={onMouseEnter}
  on:mouseleave={onMouseLeave}
  role={clickable ? 'button' : undefined}
  tabindex={clickable ? 0 : undefined}
  on:click={thumbnailClickedHandler}
  use:shortcut={{ shortcut: { key: 'Enter' }, onShortcut: thumbnailClickedHandler }}
>
  <div class="absolute z-20 h-full w-full {className}">
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
          <Icon path={mdiCheckCircle} size="24" class="text-zinc-800" />
        {:else if selected}
          <div class="rounded-full bg-[#D9DCEF] dark:bg-[#232932]">
            <Icon path={mdiCheckCircle} size="24" class="text-immich-primary" />
          </div>
        {:else}
          <Icon path={mdiCheckCircle} size="24" class="text-white/80 hover:text-white" />
        {/if}
      </button>
    {/if}
  </div>

  <div
    class="h-full w-full select-none bg-gray-100 transition-transform dark:bg-immich-dark-gray"
    class:scale-[0.85]={selected}
    class:rounded-xl={selected}
  >
    <!-- Gradient overlay on hover -->
    <div
      class="absolute z-10 h-full w-full bg-gradient-to-b from-black/25 via-[transparent_25%] opacity-0 transition-opacity group-hover:opacity-100"
      class:rounded-xl={selected}
    />

    <!-- Outline on focus -->
    <div class="absolute size-full group-focus-visible:outline outline-4 -outline-offset-4 outline-immich-primary" />

    <ImageThumbnail url={getPeopleThumbnailUrl(person.id)} altText={person.name} widthStyle="100%" shadow />
    {#if person.name}
      <span
        class="w-100 text-white-shadow absolute bottom-2 left-0 w-full text-ellipsis px-1 text-center font-medium text-white hover:cursor-pointer"
      >
        {person.name}
      </span>
    {/if}
  </div>
  {#if selectionCandidate}
    <div
      class="absolute top-0 h-full w-full bg-immich-primary opacity-40"
      in:fade={{ duration: 100 }}
      out:fade={{ duration: 100 }}
    />
  {/if}
</div>
