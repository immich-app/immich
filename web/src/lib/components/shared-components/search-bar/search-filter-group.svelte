<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    title: string;
    columns?: 1 | 2;
    children?: Snippet;
  }

  let { title, columns = 1, children }: Props = $props();
</script>

<fieldset>
  <legend class="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
    {title}
  </legend>

  <div
    class="grid gap-3"
    class:grid-cols-1={columns === 1}
    class:md:grid-cols-2={columns === 2}
  >
    {@render children?.()}
  </div>
</fieldset>
