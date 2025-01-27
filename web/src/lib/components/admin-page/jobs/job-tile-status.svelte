<script lang="ts" module>
  export type Color = 'success' | 'warning';
</script>

<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    color: Color;
    children?: Snippet;
  }

  let { color, children }: Props = $props();

  const colorClasses: Record<Color, string> = {
    success: 'bg-green-500/70 text-gray-900 dark:bg-green-700/90 dark:text-gray-100',
    warning: 'bg-orange-400/70 text-gray-900 dark:bg-orange-900 dark:text-gray-100',
  };
</script>

<div class="w-full p-2 text-center text-sm {colorClasses[color]}">
  {@render children?.()}
</div>
