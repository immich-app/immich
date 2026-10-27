<script lang="ts">
  import { ByteUnit } from '#lib/utils/byte-units.ts';
  import { Icon, Text } from '@immich/ui';
  import type { Snippet } from 'svelte';

  interface Props {
    icon?: string;
    title: string;
    value?: number;
    unit?: ByteUnit;
    tooltip?: string;
    footer?: Snippet;
  }

  let { icon, title, value, unit, tooltip, footer }: Props = $props();
  const zeros = (value?: number) => '0'.repeat(13 - (value?.toString().length ?? 0));
</script>

<div class="flex h-35 w-full flex-col justify-between rounded-3xl bg-subtle p-5 text-primary">
  <div class="flex place-items-center gap-4">
    {#if icon}
      <Icon {icon} size="40" />
    {/if}
    <Text size="giant" fontWeight="medium" title={tooltip}>{title}</Text>
  </div>

  {#if value !== undefined}
    <div class="relative mx-auto font-mono text-2xl font-medium" aria-label="{value} {unit ?? ''}">
      <span class="text-gray-300 dark:text-gray-600">{zeros(value)}</span><span>{value}</span>
      {#if unit}
        <code class="font-mono text-base font-normal">{unit}</code>
      {/if}
    </div>
  {:else}
    <div class="relative mx-auto font-mono text-2xl font-medium" aria-label="0">
      <span class="shimmer-text text-gray-300 dark:text-gray-600">{zeros()}</span>
    </div>
  {/if}

  {@render footer?.()}
</div>

<style>
  .shimmer-text {
    mask-image: linear-gradient(90deg, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0.3) 50%, rgba(0, 0, 0, 1) 100%);
    mask-size: 200% 100%;
    animation: shimmer 2.25s infinite linear;
  }

  @keyframes shimmer {
    from {
      mask-position: 200% 0;
    }
    to {
      mask-position: -200% 0;
    }
  }
</style>
