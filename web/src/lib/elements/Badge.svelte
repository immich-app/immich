<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    rounded?: boolean | 'full';
    children?: Snippet;
  }

  let { rounded = true, children }: Props = $props();
</script>

<span
  class="inline-block h-min bg-primary px-3 py-1 text-center align-baseline text-xs leading-none whitespace-nowrap text-subtle"
  class:rounded-md={rounded === true}
  class:rounded-full={rounded === 'full'}
>
  {@render children?.()}
</span>
