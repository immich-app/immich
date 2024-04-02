<script lang="ts">
  import { fade } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  import CircleIconButton from '../elements/buttons/circle-icon-button.svelte';
  import { clickOutside } from '$lib/utils/click-outside';
  import { mdiClose } from '@mdi/js';
  import FocusTrap from '$lib/components/shared-components/focus-trap.svelte';
  import ImmichLogo from '$lib/components/shared-components/immich-logo.svelte';
  import Icon from '$lib/components/elements/icon.svelte';

  const dispatch = createEventDispatcher<{
    close: void;
  }>();
  /**
   * Unique identifier for the modal.
   */
  export let id: string;
  export let title: string;
  export let zIndex = 9999;
  /**
   * If true, the logo will be displayed next to the modal title.
   */
  export let showLogo = false;
  /**
   * Optional icon to display next to the modal title, if `showLogo` is false.
   */
  export let icon: string | undefined = undefined;

  onMount(() => {
    if (browser) {
      const scrollTop = document.documentElement.scrollTop;
      const scrollLeft = document.documentElement.scrollLeft;

      /* eslint-disable unicorn/prefer-add-event-listener */
      window.onscroll = function () {
        window.scrollTo(scrollLeft, scrollTop);
      };
    }
  });

  onDestroy(() => {
    if (browser) {
      /* eslint-disable unicorn/prefer-add-event-listener */
      window.onscroll = null;
    }
  });
</script>

<FocusTrap>
  <div
    aria-modal="true"
    aria-labelledby={`${id}-title`}
    style:z-index={zIndex}
    transition:fade={{ duration: 100, easing: quintOut }}
    class="fixed left-0 top-0 flex h-full w-full place-content-center place-items-center overflow-hidden bg-black/50"
  >
    <div
      use:clickOutside={{
        onOutclick: () => dispatch('close'),
        onEscape: () => dispatch('close'),
      }}
      class="max-h-[800px] min-h-[200px] w-[450px] overflow-y-auto rounded-3xl bg-immich-bg shadow-md dark:bg-immich-dark-gray dark:text-immich-dark-fg immich-scrollbar"
      tabindex="-1"
    >
      <div class="flex place-items-center justify-between px-5 py-3">
        <div class="flex gap-2 place-items-center">
          {#if showLogo}
            <ImmichLogo noText={true} width={32} />
          {:else if icon}
            <Icon path={icon} size={32} ariaHidden={true} class="text-immich-primary dark:text-immich-dark-primary" />
          {/if}
          <h1 id={`${id}-title`}>
            {title}
          </h1>
        </div>

        <CircleIconButton on:click={() => dispatch('close')} icon={mdiClose} size={'20'} title="Close" />
      </div>

      <div>
        <slot />
      </div>

      {#if $$slots['sticky-bottom']}
        <div class="sticky bottom-0 bg-immich-bg px-5 pb-5 pt-3 dark:bg-immich-dark-gray">
          <slot name="sticky-bottom" />
        </div>
      {/if}
    </div>
  </div>
</FocusTrap>
