<script lang="ts">
  import type { Snippet } from 'svelte';
  import { tv } from 'tailwind-variants';

  type Props = {
    color: 'success' | 'warning';
    children?: Snippet;
  };

  let { color, children }: Props = $props();

  const styles = tv({
    base: 'w-full p-2 text-center text-sm ',
    variants: {
      color: {
        success: 'bg-green-500/70 text-gray-900 dark:bg-green-700/90 dark:text-gray-100',
        warning: 'bg-orange-400/70 text-gray-900 dark:bg-orange-900 dark:text-gray-100',
      },
    },
  });
</script>

<div class={styles({ color })}>
  {@render children?.()}
</div>
