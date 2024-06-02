<script lang="ts">
  import { clickOutside } from '$lib/actions/click-outside';
  import { fade } from 'svelte/transition';
  import FocusTrap from '$lib/components/shared-components/focus-trap.svelte';
  import ModalHeader from '$lib/components/shared-components/modal-header.svelte';
  import { generateId } from '$lib/utils/generate-id';

  export let onClose: () => void;
  export let title: string;
  /**
   * If true, the logo will be displayed next to the modal title.
   */
  export let showLogo = false;
  /**
   * Optional icon to display next to the modal title, if `showLogo` is false.
   */
  export let icon: string | undefined = undefined;
  /**
   * Sets the width of the modal.
   *
   * - `wide`: 48rem
   * - `narrow`: 28rem
   * - `auto`: fits the width of the modal content, up to a maximum of 32rem
   */
  export let width: 'wide' | 'narrow' | 'auto' = 'narrow';

  /**
   * Unique identifier for the modal.
   */
  let id: string = generateId();

  $: titleId = `${id}-title`;
  $: isStickyBottom = !!$$slots['sticky-bottom'];

  let modalWidth: string;
  $: {
    if (width === 'wide') {
      modalWidth = 'w-[48rem]';
    } else if (width === 'narrow') {
      modalWidth = 'w-[28rem]';
    } else {
      modalWidth = 'sm:max-w-lg';
    }
  }
</script>

<section
  role="presentation"
  in:fade={{ duration: 100 }}
  out:fade={{ duration: 100 }}
  class="fixed left-0 top-0 z-[9999] flex h-dvh w-screen place-content-center place-items-center bg-black/40"
  on:keydown={(event) => {
    event.stopPropagation();
  }}
>
  <FocusTrap>
    <div
      class="z-[9999] max-w-[95vw] max-h-[min(95dvh,56rem)] {modalWidth} overflow-y-auto rounded-3xl bg-immich-bg shadow-md dark:bg-immich-dark-gray dark:text-immich-dark-fg immich-scrollbar"
      use:clickOutside={{ onOutclick: onClose, onEscape: onClose }}
      tabindex="-1"
      aria-modal="true"
      aria-labelledby={titleId}
      class:scroll-pb-40={isStickyBottom}
      class:sm:scroll-p-24={isStickyBottom}
    >
      <ModalHeader id={titleId} {title} {showLogo} {icon} {onClose} />
      <div class="p-5 pt-0">
        <slot />
      </div>
      {#if isStickyBottom}
        <div
          class="flex flex-col sm:flex-row justify-end w-full gap-2 sm:gap-4 sticky bottom-0 py-4 px-5 bg-immich-bg dark:bg-immich-dark-gray border-t border-gray-200 dark:border-gray-500 shadow"
        >
          <slot name="sticky-bottom" />
        </div>
      {/if}
    </div>
  </FocusTrap>
</section>
