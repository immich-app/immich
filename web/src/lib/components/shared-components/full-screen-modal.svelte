<script lang="ts">
  import { clickOutside } from '../../utils/click-outside';
  import { fade } from 'svelte/transition';
  import FocusTrap from '$lib/components/shared-components/focus-trap.svelte';
  import ModalHeader from '$lib/components/shared-components/modal-header.svelte';

  export let onClose: (() => void) | undefined = undefined;

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
</script>

<FocusTrap>
  <section
    in:fade={{ duration: 100 }}
    out:fade={{ duration: 100 }}
    class="fixed left-0 top-0 z-[9990] flex h-screen w-screen place-content-center place-items-center bg-black/40"
  >
    <div
      class="z-[9999] max-w-[95vw] overflow-y-auto rounded-2xl p-4 py-8 bg-immich-bg shadow-md dark:bg-immich-dark-gray dark:text-immich-dark-fg immich-scrollbar"
      use:clickOutside={{ onOutclick: onClose, onEscape: onClose }}
      tabindex="-1"
    >
      <ModalHeader {id} {title} {showLogo} {icon} on:close={() => onClose?.()} />
      <slot />
    </div>
  </section>
</FocusTrap>
