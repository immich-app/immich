<script lang="ts">
  import { Icon, Text } from '@immich/ui';
  import type { Snippet } from 'svelte';

  interface Props {
    icon: string;
    children?: Snippet;
    borderBottom?: boolean;
    highlight?: boolean;
    title?: string;
  }

  let { icon, children, borderBottom = true, highlight = false, title }: Props = $props();
</script>

<div class="grid grid-cols-[25px_1fr] w-full px-1 py-0.5" class:border-b={borderBottom} {title}>
  <Icon {icon} size="18" class="text-dark/25 {highlight ? 'text-primary/75' : ''}" />
  <div class="justify-self-end text-end rounded px-1 transition-colors w-full overflow-hidden">
    <Text size="tiny" class={`${highlight ? 'font-semibold text-primary' : ''} text-ellipsis w-full overflow-hidden`}>
      {@render children?.()}
    </Text>
  </div>
</div>
