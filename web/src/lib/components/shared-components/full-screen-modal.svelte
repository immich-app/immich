<script lang="ts">
  import { clickOutside } from '../../utils/click-outside';
  import { fade } from 'svelte/transition';
  import FocusTrap from '$lib/components/shared-components/focus-trap.svelte';
  import ModalHeader from '$lib/components/shared-components/modal-header.svelte';

  export let onClose: () => void;

  /**
   * Unique identifier for the modal.
   */
  export let id: string;
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
   * - `wide`: 750px
   * - `narrow`: 450px
   * - `auto`: fits the width of the modal content, up to a maximum of 550px
   */
  export let width: 'wide' | 'narrow' | 'auto' = 'narrow';

  $: titleId = `${id}-title`;

  let modalWidth: string;
  $: {
    if (width === 'wide') {
      modalWidth = 'w-[750px]';
    } else if (width === 'narrow') {
      modalWidth = 'w-[450px]';
    } else {
      modalWidth = 'sm:max-w-[550px]';
    }
  }
</script>

<FocusTrap>
  <section
    in:fade={{ duration: 100 }}
    out:fade={{ duration: 100 }}
    class="fixed left-0 top-0 z-[9990] flex h-screen w-screen place-content-center place-items-center bg-black/40"
  >
    <div
      class="z-[9999] max-w-[95vw] max-h-[95vh] {modalWidth} overflow-y-auto rounded-3xl bg-immich-bg shadow-md dark:bg-immich-dark-gray dark:text-immich-dark-fg immich-scrollbar"
      use:clickOutside={{ onOutclick: onClose, onEscape: onClose }}
      tabindex="-1"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <ModalHeader id={titleId} {title} {showLogo} {icon} on:close={() => onClose?.()} />
      <div class="p-5 pt-0">
        <slot />
      </div>
    </div>
  </section>
</FocusTrap>
