<script lang="ts" module>
  export type Color = 'primary' | 'secondary';
  export type Rounded = false | true | 'full';
</script>

<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    color?: Color;
    rounded?: Rounded;
    children?: Snippet;
  }

  let { color = 'primary', rounded = true, children }: Props = $props();

  const colorClasses: Record<Color, string> = {
    primary: 'text-gray-100 dark:text-immich-dark-gray bg-immich-primary dark:bg-immich-dark-primary',
    secondary: 'text-immich-dark-bg dark:text-immich-gray dark:bg-gray-600 bg-gray-300 dark:text-immich-gray',
  };
</script>

<span
  class="inline-block h-min whitespace-nowrap px-3 py-1 text-center align-baseline text-xs leading-none {colorClasses[
    color
  ]}"
  class:rounded-md={rounded === true}
  class:rounded-full={rounded === 'full'}
>
  {@render children?.()}
</span>
