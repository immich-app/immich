<script lang="ts">
  import { ByteUnit } from '$lib/utils/byte-units';
  import { Icon, Text } from '@immich/ui';

  type ValueData = {
    value: number;
    unit?: ByteUnit | undefined;
  };

  interface Props {
    icon: string;
    title: string;
    valuePromise: Promise<ValueData>;
  }

  let { icon, title, valuePromise }: Props = $props();
  const zeros = (data?: ValueData) => {
    let length = 13;
    if (data) {
      const valueLength = data.value.toString().length;
      length = length - valueLength;
    }

    return '0'.repeat(length);
  };
</script>

<div class="flex h-35 w-full flex-col justify-between rounded-3xl bg-subtle text-primary p-5">
  <div class="flex place-items-center gap-4">
    <Icon {icon} size="40" />
    <Text size="giant" fontWeight="medium">{title}</Text>
  </div>

  {#await valuePromise}
    <div class="mx-auto font-mono text-2xl font-medium relative">
      <span class="text-gray-300 dark:text-gray-600 shimmer-text">{zeros()}</span>
    </div>
  {:then data}
    <div class="mx-auto font-mono text-2xl font-medium relative">
      <span class="text-gray-300 dark:text-gray-600">{zeros(data)}</span><span>{data.value}</span>
      {#if data.unit}
        <code class="font-mono text-base font-normal">{data.unit}</code>
      {/if}
    </div>
  {:catch _}
    <div class="mx-auto font-mono text-2xl font-medium relative">
      <span class="text-gray-300 dark:text-gray-600">{zeros()}</span>
    </div>
  {/await}
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
