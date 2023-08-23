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
  export let ignoreClickOutside = false;

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
    on:outclick={() => !ignoreClickOutside && dispatch('close')}
    class="max-h-[700px] min-h-[200px] w-[450px] overflow-y-auto rounded-lg bg-immich-bg shadow-md dark:bg-immich-dark-gray dark:text-immich-dark-fg"
  >
    <div class="sticky top-0 flex place-items-center justify-between bg-immich-bg px-5 py-3 dark:bg-immich-dark-gray">
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

    {#if $$slots['sticky-bottom']}
      <div class="sticky bottom-0 bg-immich-bg px-5 pb-5 pt-3 dark:bg-immich-dark-gray">
        <slot name="sticky-bottom" />
      </div>
    {/if}
  </div>
</div>
