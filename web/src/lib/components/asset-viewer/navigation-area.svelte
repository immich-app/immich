<script lang="ts">
  interface Props {
    onClick: (e: MouseEvent) => void;
    label: string;
    children?: import('svelte').Snippet;
  }

  let { onClick, label, children }: Props = $props();
</script>

<button
  type="button"
  class="my-auto mx-4 rounded-full p-3 text-gray-500 transition hover:bg-gray-500 hover:text-white"
  aria-label={label}
  onclick={onClick}
>
  {@render children?.()}
</button>
