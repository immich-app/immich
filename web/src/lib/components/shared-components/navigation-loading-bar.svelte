<script lang="ts">
  import { onMount } from 'svelte';
  import { cubicOut } from 'svelte/easing';
  import { tweened } from 'svelte/motion';

  const progress = tweened(0, {
    duration: 1000,
    easing: cubicOut,
  });

  onMount(async () => {
    await progress.set(90);
  });
</script>

<div class="absolute left-0 top-0 z-[999999999] h-[3px] w-screen bg-white">
  <span class="absolute h-[3px] bg-immich-primary" style:width={`${$progress}%`} />
</div>
