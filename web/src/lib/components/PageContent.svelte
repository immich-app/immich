<script lang="ts">
  import { Container, Scrollable, type Size } from '@immich/ui';
  import type { Snippet } from 'svelte';

  type Props = {
    size?: Size;
    center?: boolean;
    children?: Snippet;
    class?: string;
  };

  const { size, center, class: className, children }: Props = $props();
</script>

<Scrollable class="grow">
  <Container {size} {center} {children} class="p-2 pb-16 {className ?? ''}" />
</Scrollable>
