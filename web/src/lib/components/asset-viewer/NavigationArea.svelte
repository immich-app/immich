<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    onClick: (e: MouseEvent) => void;
    label: string;
    children?: Snippet;
  }

  let { onClick, label, children }: Props = $props();
</script>

<button
  type="button"
  class="mx-4 my-auto rounded-full p-3 text-gray-500 transition hover:bg-gray-500 hover:text-white"
  aria-label={label}
  onclick={onClick}
>
  {@render children?.()}
</button>
