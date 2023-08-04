<script lang="ts">
  import { clickOutside } from '../../utils/click-outside';
  import { createEventDispatcher } from 'svelte';
  import { fade } from 'svelte/transition';

  const dispatch = createEventDispatcher<{ clickOutside: void }>();
</script>

<section
  in:fade={{ duration: 100 }}
  out:fade={{ duration: 100 }}
  class="fixed left-0 top-0 z-[990] flex h-screen w-screen place-content-center place-items-center bg-black/40"
>
  <div class="z-[9999]" use:clickOutside on:outclick={() => dispatch('clickOutside')}>
    <slot />
  </div>
</section>
