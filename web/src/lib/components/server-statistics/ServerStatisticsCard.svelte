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

<div class="flex h-35 w-full flex-col justify-between rounded-3xl bg-subtle text-primary p-5">
  <div class="flex place-items-center gap-4">
    <Icon {icon} size="40" />
    <Text size="giant" class="font-medium">{title}</Text>
  </div>

  <div class="relative mx-auto font-immich-mono text-2xl font-medium">
    <span class="text-gray-300 dark:text-gray-600">{zeros()}</span><span>{value}</span>
    {#if unit}
      <Code color="muted" class="font-immich-mono absolute -top-5 end-1 font-light p-0">{unit}</Code>
    {/if}
  </div>
</div>
