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
  class="absolute left-0 top-0 z-[9999] h-full w-full bg-immich-bg dark:bg-immich-dark-bg"
>
  <div
    class="absolute flex h-16 w-full place-items-center justify-between border-b dark:border-immich-dark-gray dark:text-immich-dark-fg"
  >
    <div class="flex w-full items-center justify-between p-8">
      <div class="flex items-center">
        <CircleIconButton logo={Close} on:click={() => dispatch('closeClick')} />
        <p class="ml-4">Show & hide faces</p>
      </div>
      <IconButton on:click={() => dispatch('doneClick')}>Done</IconButton>
    </div>
    <div class="immich-scrollbar absolute top-16 h-[calc(100%-theme(spacing.16))] w-full p-4 pb-8">
      <slot />
    </div>
  </div>
</section>
