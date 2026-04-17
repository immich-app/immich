<script lang="ts">
  import { cleanClass } from '$lib';
  import type { ClassValue } from 'svelte/elements';

  interface Props {
    class?: ClassValue;
  }

  let { class: className }: Props = $props();
</script>

<div class={cleanClass('absolute h-full w-full bg-gray-300 dark:bg-gray-700', className)}></div>
