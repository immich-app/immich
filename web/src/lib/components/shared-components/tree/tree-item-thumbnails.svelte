<script lang="ts">
  import Icon from '$lib/components/elements/icon.svelte';

  export let items: string[] = [];
  export let icon: string;
  export let onClick: (path: string) => void;
</script>

{#if items.length > 0}
  <div
    class="w-full grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 2xl:grid-cols-8 gap-2 bg-gray-50 dark:bg-immich-dark-gray/50 rounded-2xl border border-gray-100 dark:border-gray-900 max-h-[500px] overflow-auto immich-scrollbar"
  >
    {#each items as item}
      <button
        class="flex flex-col place-items-center gap-2 py-2 px-4 hover:bg-immich-primary/10 dark:hover:bg-immich-primary/40 rounded-xl"
        on:click={() => onClick(item)}
        title={item}
        type="button"
      >
        <Icon path={icon} class="text-immich-primary dark:text-immich-dark-primary" size={64} />
        <p class="text-sm dark:text-gray-200 text-nowrap text-ellipsis overflow-clip w-full">{item}</p>
      </button>
    {/each}
  </div>
{/if}
