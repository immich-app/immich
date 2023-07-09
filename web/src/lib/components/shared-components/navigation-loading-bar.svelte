<script lang="ts">
  import { onMount } from 'svelte';
  import { cubicOut } from 'svelte/easing';
  import { tweened } from 'svelte/motion';

  const progress = tweened(0, {
    duration: 1000,
    easing: cubicOut,
  });

  onMount(() => {
    progress.set(90);
  });
</script>

<div class="absolute top-0 left-0 w-screen h-[3px] bg-white z-[999999999]">
  <span class="absolute bg-immich-primary h-[3px]" style:width={`${$progress}%`} />
</div>
