<script lang="ts">
  import { Container, Scrollable, type Size } from '@immich/ui';
  import type { Snippet } from 'svelte';

  interface Props {
    id?: string;
    title?: string;
    size?: Size | 'full';
    buttons?: Snippet;
    children?: Snippet;
  }

  let { title, size, buttons, children, id }: Props = $props();
</script>

<div class="h-full flex flex-col">
  <div class="flex h-16 w-full place-items-center justify-between border-b p-2">
    <div class="font-medium outline-none" tabindex="-1" {id}>{title}</div>
    {@render buttons?.()}
  </div>
  <Scrollable class="grow">
    <Container {size} class="flex flex-col p-4">
      {@render children?.()}
    </Container>
  </Scrollable>
</div>
