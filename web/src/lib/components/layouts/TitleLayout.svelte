<script lang="ts">
  import { Text } from '@immich/ui';
  import type { Snippet } from 'svelte';

  interface Props {
    id?: string;
    title?: string;
    description?: string;
    buttons?: Snippet;
    children?: Snippet;
  }

  let { id, title, description, buttons, children }: Props = $props();
</script>

<div class="h-full flex flex-col">
  <div class="flex h-16 w-full place-items-center justify-between border-b p-2">
    <div class="flex gap-1">
      <div class="font-medium outline-none" tabindex="-1" {id}>{title}</div>
      {#if description}
        <Text color="muted">{description}</Text>
      {/if}
    </div>
    {@render buttons?.()}
  </div>
  {@render children?.()}
</div>
