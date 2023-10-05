<script lang="ts">
  import { fade } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import Close from 'svelte-material-icons/Close.svelte';
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import CircleIconButton from '../elements/buttons/circle-icon-button.svelte';
  import { clickOutside } from '$lib/utils/click-outside';

  const dispatch = createEventDispatcher();
  export let zIndex = 9999;

  onMount(() => {
    if (browser) {
      const scrollTop = document.documentElement.scrollTop;
      const scrollLeft = document.documentElement.scrollLeft;
      window.onscroll = function () {
        window.scrollTo(scrollLeft, scrollTop);
      };
    }
  });

  onDestroy(() => {
    if (browser) {
      window.onscroll = null;
    }
  });
</script>

<div
  id="immich-modal"
  style:z-index={zIndex}
  transition:fade={{ duration: 100, easing: quintOut }}
  class="fixed left-0 top-0 flex h-full w-full place-content-center place-items-center overflow-hidden bg-black/50"
>
  <div
    use:clickOutside
    on:outclick={() => dispatch('close')}
    on:escape={() => dispatch('escape')}
    class="max-h-[600px] min-h-[200px] w-[450px] rounded-lg bg-immich-bg shadow-md dark:bg-immich-dark-gray dark:text-immich-dark-fg"
  >
    <div class="flex place-items-center justify-between px-5 py-3">
      <div>
        <slot name="title">
          <p>Modal Title</p>
        </slot>
      </div>

      <CircleIconButton on:click={() => dispatch('close')} logo={Close} size={'20'} />
    </div>

    <div class="">
      <slot />
    </div>
  </div>
</div>
