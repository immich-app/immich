<script lang="ts">
  import type { ClassValue } from 'svelte/elements';

  interface Props {
    class?: ClassValue;
  }

  let { class: className = '' }: Props = $props();
</script>

<div class="absolute h-full w-full bg-gray-300 dark:bg-gray-700 {className}"></div>
