<script lang="ts" module>
  export type Color = 'transparent-primary' | 'transparent-gray';
</script>

<script lang="ts">
  import Button from '$lib/components/elements/buttons/button.svelte';
  import type { Snippet } from 'svelte';

  interface Props {
    href?: string;
    color?: Color;
    children?: Snippet;
    onclick?: (e: MouseEvent) => void;
    title?: string;
    disabled?: boolean;
    fullwidth?: boolean;
    class?: string;
  }

  let { color = 'transparent-gray', children, ...rest }: Props = $props();
</script>

<Button size="link" {color} shadow={false} rounded="lg" {...rest}>
  {@render children?.()}
</Button>
