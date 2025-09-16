<script lang="ts">
  import { ByteUnit } from '$lib/utils/byte-units';
  import { Code, Icon, Text } from '@immich/ui';

  interface Props {
    icon: string;
    title: string;
    value: number;
    unit?: ByteUnit | undefined;
  }

  let { icon, title, value, unit = undefined }: Props = $props();

  const zeros = $derived(() => {
    const maxLength = 13;
    const valueLength = value.toString().length;
    const zeroLength = maxLength - valueLength;

    return '0'.repeat(zeroLength);
  });
</script>

<div class="flex h-[140px] w-full flex-col justify-between rounded-3xl bg-subtle text-primary p-5">
  <div class="flex place-items-center gap-4">
    <Icon {icon} size="40" />
    <Text size="large" fontWeight="bold" class="uppercase">{title}</Text>
  </div>

  <div class="relative mx-auto font-mono text-2xl font-semibold">
    <span class="text-gray-400 dark:text-gray-600">{zeros()}</span><span>{value}</span>
    {#if unit}
      <Code color="muted" class="absolute -top-5 end-1 font-light">{unit}</Code>
    {/if}
  </div>
</div>
