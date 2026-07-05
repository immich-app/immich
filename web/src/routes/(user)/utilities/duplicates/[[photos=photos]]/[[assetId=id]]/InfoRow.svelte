<script lang="ts">
  import { Icon, Text } from '@immich/ui';
  import type { Snippet } from 'svelte';

  interface Props {
    icon: string;
    children?: Snippet;
    borderBottom?: boolean;
    title?: string;
  }

  let { icon, children, borderBottom = true, title }: Props = $props();
</script>

<div class="grid w-full grid-cols-[20px_auto_1fr] overflow-hidden px-1 py-0.5" class:border-b={borderBottom} {title}>
  <Icon {icon} size="16" class="self-center text-dark/25" />

  {#if title}
    <Text size="tiny" class="self-center truncate px-1 pr-2 text-immich-fg/40 dark:text-immich-dark-fg/40">
      {title}
    </Text>
  {/if}

  <div class="justify-self-end overflow-hidden rounded-sm px-1 text-end transition-colors">
    <Text size="tiny" class="break-all">
      {@render children?.()}
    </Text>
  </div>
</div>
