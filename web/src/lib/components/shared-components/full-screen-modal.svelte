<script lang="ts">
  import { clickOutside } from '../../utils/click-outside';
  import { fade } from 'svelte/transition';
  import FocusTrap from '$lib/components/shared-components/focus-trap.svelte';

  export let onClose: (() => void) | undefined = undefined;
</script>

<FocusTrap>
  <section
    in:fade={{ duration: 100 }}
    out:fade={{ duration: 100 }}
    class="fixed left-0 top-0 z-[9990] flex h-screen w-screen place-content-center place-items-center bg-black/40"
  >
    <div class="z-[9999]" use:clickOutside={{ onOutclick: onClose, onEscape: onClose }} tabindex="-1">
      <slot />
    </div>
  </section>
</FocusTrap>
