<script lang="ts">
  import type Icon from 'svelte-material-icons/AbTesting.svelte';

  export let logo: typeof Icon;
  export let title: string;
  export let value: number;
  export let unit: string | undefined = undefined;

  $: zeros = () => {
    const maxLength = 13;
    const valueLength = value.toString().length;
    const zeroLength = maxLength - valueLength;

    return '0'.repeat(zeroLength);
  };
</script>

<div class="flex h-[140px] w-[250px] flex-col justify-between rounded-3xl bg-immich-gray p-5 dark:bg-immich-dark-gray">
  <div class="flex place-items-center gap-4 text-immich-primary dark:text-immich-dark-primary">
    <svelte:component this={logo} size="40" />
    <p>{title}</p>
  </div>

  <div class="relative text-center font-mono text-2xl font-semibold">
    <span class="text-[#DCDADA] dark:text-[#525252]">{zeros()}</span><span
      class="text-immich-primary dark:text-immich-dark-primary">{value}</span
    >
    {#if unit}
      <span class="absolute -top-5 right-2 text-base font-light text-gray-400">{unit}</span>
    {/if}
  </div>
</div>
