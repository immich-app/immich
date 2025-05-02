<script lang="ts">
  import Icon from '$lib/components/elements/icon.svelte';
  import { ByteUnit } from '$lib/utils/byte-units';
  import { Text } from '@immich/ui';

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

<div class="flex h-[140px] w-[250px] flex-col justify-between rounded-3xl bg-subtle p-5 dark:bg-immich-dark-gray">
  <div class="flex place-items-center gap-4 text-immich-primary dark:text-immich-dark-primary">
    <Icon path={icon} size="40" />
    <Text size="large">{title}</Text>
  </div>

  <div class="relative mx-auto font-mono text-2xl font-semibold">
    <span class="text-gray-300 dark:text-gray-700">{zeros()}</span><span
      class="text-immich-primary dark:text-immich-dark-primary">{value}</span
    >
    {#if unit}
      <span class="absolute -top-5 end-2 text-primary/50">{unit}</span>
    {/if}
  </div>
</div>
