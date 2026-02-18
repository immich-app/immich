<script lang="ts">
  import { Icon, Text } from '@immich/ui';
  import type { Snippet } from 'svelte';

  interface Props {
    icon: string;
    children?: Snippet;
    borderBottom?: boolean;
    highlight?: boolean;
    title?: string;
    showLabel?: boolean; // <--- New prop
  }

  let { icon, children, borderBottom = true, highlight = false, title, showLabel = true }: Props = $props();
</script>

<!-- 
  If showLabel is true: 3 columns [icon | label | value]
  If showLabel is false: 2 columns [icon | value] 
-->
<div
  class="grid w-full px-1 py-0.5 overflow-hidden {showLabel ? 'grid-cols-[25px_auto_1fr]' : 'grid-cols-[25px_1fr]'}"
  class:border-b={borderBottom}
  {title}
>
  <Icon {icon} size="18" class="text-dark/25 {highlight ? 'text-primary/75' : ''}" />

  {#if showLabel}
    {#if title}
      <Text size="tiny" class="text-immich-fg/50 dark:text-immich-dark-fg/50 self-center truncate px-1 pr-3">
        {title}
      </Text>
    {/if}
  {/if}

  <div class="overflow-hidden justify-self-end text-end rounded px-1 transition-colors">
    <Text
      size="tiny"
      fontWeight={highlight ? 'semi-bold' : 'normal'}
      class="break-all {highlight ? 'text-primary' : ''}"
    >
      {@render children?.()}
    </Text>
  </div>
</div>
