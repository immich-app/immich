<script lang="ts">
  import { shortcut } from '$lib/utils/shortcut';
  import { clickOutside } from '../../utils/click-outside';
  import { fade } from 'svelte/transition';

  export let onClose: (() => void) | undefined = undefined;
</script>

<section
  in:fade={{ duration: 100 }}
  out:fade={{ duration: 100 }}
  class="fixed left-0 top-0 z-[9990] flex h-screen w-screen place-content-center place-items-center bg-black/40"
>
  <div
    class="z-[9999]"
    use:clickOutside={{ onOutclick: onClose }}
    use:shortcut={{
      shortcut: { key: 'Escape' },
      onShortcut: () => onClose?.(),
    }}
  >
    <slot />
  </div>
</section>
