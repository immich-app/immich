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

<div class="grid w-full grid-cols-[25px_1fr] px-1 py-0.5" class:border-b={borderBottom} {title}>
  <Icon {icon} size="18" class="text-dark/25 {highlight ? 'text-primary/75' : ''}" />
  <div class="w-full justify-self-end overflow-hidden rounded-sm px-1 text-end transition-colors">
    <Text
      size="tiny"
      fontWeight={highlight ? 'semi-bold' : 'normal'}
      class={`${highlight ? 'text-primary' : ''} w-full overflow-hidden text-ellipsis`}
    >
      {@render children?.()}
    </Text>
  </div>
</div>
