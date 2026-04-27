<script lang="ts" module>
  export type Colors = 'light-gray' | 'gray' | 'dark-gray';
</script>

<script lang="ts">
  import type { Snippet } from 'svelte';
  import { tv } from 'tailwind-variants';

  interface Props {
    color: Colors;
    disabled?: boolean;
    children?: Snippet;
    onClick?: () => void;
  }

  let { color, disabled = false, onClick = () => {}, children }: Props = $props();

  const styles = tv({
    base: 'flex h-full w-full flex-col place-content-center place-items-center gap-2 px-8 py-2 text-xs text-gray-600 transition-colors dark:text-gray-200 ',
    variants: {
      color: {
        'light-gray': 'bg-gray-300/80 dark:bg-gray-700',
        gray: 'bg-gray-300/90 dark:bg-gray-700/90',
        'dark-gray': 'bg-gray-300 dark:bg-gray-700/80',
      },
      disabled: {
        true: 'cursor-not-allowed',
        false: 'hover:bg-immich-primary hover:text-white dark:hover:bg-immich-dark-primary dark:hover:text-black',
      },
    },
  });
</script>

<button type="button" {disabled} class={styles({ disabled, color })} onclick={onClick}>
  {@render children?.()}
</button>
