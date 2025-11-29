<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    title: string;
    children?: Snippet;
  }

  let { title, children }: Props = $props();
</script>

<div>
  <h2 class="mb-2 text-xs font-medium tracking-wide text-light-500 uppercase">
    {title}
  </h2>

  <div class="divide-y divide-light-300 overflow-hidden rounded-2xl border bg-light-50 dark:border-neutral-700">
    {@render children?.()}
  </div>
</div>
