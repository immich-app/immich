<script lang="ts">
  import { ByteUnit } from '$lib/utils/byte-units';
  import { Icon, Text } from '@immich/ui';
  import type { Snippet } from 'svelte';

  type ValueData = {
    value: number;
    unit?: ByteUnit | undefined;
  };

  interface Props {
    icon?: string;
    title: string;
    value?: ValueData;
    tooltip?: string;
    footer?: Snippet;
  }

  let { icon, title, value, tooltip, footer }: Props = $props();
  const zeros = (data?: ValueData) => {
    let length = 13;
    if (data) {
      const valueLength = data.value.toString().length;
      length -= valueLength;
    }

    return '0'.repeat(length);
  };
</script>

<div class="flex h-35 w-full flex-col justify-between rounded-3xl bg-subtle p-5 text-primary">
  <div class="flex place-items-center gap-4">
    {#if icon}
      <Icon {icon} size="40" />
    {/if}
    <Text size="giant" fontWeight="medium" title={tooltip}>{title}</Text>
  </div>

  {#if value}
    <div class="relative mx-auto font-mono text-2xl font-medium" aria-label="{value.value} {value.unit ?? ''}">
      <span class="text-gray-300 dark:text-gray-600">{zeros(value)}</span><span>{value.value}</span>
      {#if value.unit}
        <code class="font-mono text-base font-normal">{value.unit}</code>
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
