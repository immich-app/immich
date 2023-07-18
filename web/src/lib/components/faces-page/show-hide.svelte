<script>
  import { fly } from 'svelte/transition';
  import CircleIconButton from '../elements/buttons/circle-icon-button.svelte';
  import { quintOut } from 'svelte/easing';
  import Close from 'svelte-material-icons/Close.svelte';
  import IconButton from '../elements/buttons/icon-button.svelte';
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();
</script>

<section
  transition:fly={{ y: 500, duration: 100, easing: quintOut }}
  class="absolute top-0 left-0 w-full h-full bg-immich-bg dark:bg-immich-dark-bg z-[9999]"
>
  <div
    class="absolute border-b dark:border-immich-dark-gray flex justify-between place-items-center dark:text-immich-dark-fg w-full h-16"
  >
    <div class="flex items-center justify-between p-8 w-full">
      <div class="flex items-center">
        <CircleIconButton logo={Close} on:click={() => dispatch('closeClick')} />
        <p class="ml-4">Show & hide faces</p>
      </div>
      <IconButton on:click={() => dispatch('doneClick')}>Done</IconButton>
    </div>
    <div class="absolute top-16 h-[calc(100%-theme(spacing.16))] w-full immich-scrollbar p-4 pb-8">
      <slot />
    </div>
  </div>
</section>
