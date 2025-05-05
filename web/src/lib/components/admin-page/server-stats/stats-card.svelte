<script lang="ts">
  import Icon from '$lib/components/elements/icon.svelte';
  import { ByteUnit } from '$lib/utils/byte-units';

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

<div class="flex h-[140px] w-[250px] flex-col justify-between rounded-3xl bg-immich-gray p-5 dark:bg-immich-dark-gray">
  <div class="flex place-items-center gap-4 text-immich-primary dark:text-immich-dark-primary">
    <Icon path={icon} size="40" />
    <p>{title}</p>
  </div>

  <div class="relative text-center font-mono text-2xl font-semibold">
    <span class="text-[#DCDADA] dark:text-[#525252]">{zeros()}</span><span
      class="text-immich-primary dark:text-immich-dark-primary">{value}</span
    >
    {#if unit}
      <span class="absolute -top-5 end-2 text-base font-light text-gray-400">{unit}</span>
    {/if}
  </div>
</div>
