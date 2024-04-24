<script lang="ts">
  import { onMount } from 'svelte';
  import { cubicOut } from 'svelte/easing';
  import { tweened } from 'svelte/motion';

  let showing = false;

  // delay showing any progress for a little bit so very fast loads
  // do not cause flicker
  const delay = 100;

  const progress = tweened(0, {
    duration: 1000,
    easing: cubicOut,
  });

  function animate() {
    showing = true;
    void progress.set(90);
  }

  onMount(() => {
    const timer = setTimeout(animate, delay);
    return () => clearTimeout(timer);
  });
</script>

{#if showing}
  <div class="absolute left-0 top-0 z-[999999999] h-[3px] w-screen bg-white">
    <span class="absolute h-[3px] bg-immich-primary" style:width={`${$progress}%`} />
  </div>
{/if}
