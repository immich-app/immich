<script lang="ts">
  import { Icon, Text } from '@immich/ui';
  import type { Snippet } from 'svelte';

  interface Props {
    icon: string;
    children: Snippet;
    title: string;
  }

  let { icon, children, title }: Props = $props();
</script>

<div class="grid w-full grid-cols-[20px_auto_1fr] gap-1 overflow-hidden px-2 py-1.5" {title}>
  <Icon {icon} size="16" class="self-center text-dark/25" />

  <Text size="tiny" class="self-center truncate pe-1 text-immich-fg/40 dark:text-immich-dark-fg/40">
    {title}
  </Text>

  <div class="justify-self-end overflow-hidden rounded-sm text-end transition-colors">
    <Text size="tiny" class="break-all">
      {@render children()}
    </Text>
  </div>
</div>
