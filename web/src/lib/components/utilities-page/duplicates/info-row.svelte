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

<div class="grid grid-cols-[20px_auto_1fr] w-full px-1 py-0.5 overflow-hidden" class:border-b={borderBottom} {title}>
  <Icon {icon} size="16" class="text-dark/25 self-center" />

  {#if title}
    <Text size="tiny" class="text-immich-fg/40 dark:text-immich-dark-fg/40 self-center truncate px-1 pr-2 text-[10px]">
      {title}
    </Text>
  {/if}

  <div class="overflow-hidden justify-self-end text-end rounded px-1 transition-colors">
    <Text size="tiny" class="break-all text-[10px]">
      {@render children?.()}
    </Text>
  </div>
</div>
