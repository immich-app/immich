<script lang="ts">
  import type { ClassValue } from 'svelte/elements';

  interface Props {
    class?: ClassValue;
  }

  let { class: className }: Props = $props();
</script>

<div class="delayed inline-flex items-center gap-1 {className}">
  {#each [0, 1, 2] as i (i)}
    <span class="dot block size-1.5 rounded-full bg-white shadow-[0_0_3px_rgba(0,0,0,0.6)]" style:--delay="{i * 0.25}s"
    ></span>
  {/each}
</div>

<style>
  .delayed {
    visibility: hidden;
    animation: delayed-visibility 0s linear 0.4s forwards;
  }

  @keyframes delayed-visibility {
    to {
      visibility: visible;
    }
  }

  .dot {
    animation: dot-stream 1.6s var(--delay, 0s) ease-in-out infinite;
  }

  @keyframes dot-stream {
    0%,
    80%,
    100% {
      opacity: 0.3;
      transform: scale(0.8);
    }
    40% {
      opacity: 1;
      transform: scale(1.15);
    }
  }
</style>
