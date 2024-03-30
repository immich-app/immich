<script lang="ts">
  export let filters: string[];
  export let selected: string;
  export let onSelect: (selected: string) => void;
</script>

<div class="flex bg-gray-200 dark:bg-immich-dark-gray rounded-2xl h-full">
  {#each filters as filter, index}
    <button
      class="text-sm px-4 {filter === selected
        ? 'dark:bg-gray-700 bg-gray-300'
        : 'dark:hover:bg-gray-800 hover:bg-gray-300'}  {index === 0 ? 'rounded-l-2xl' : ''} {index ===
      filters.length - 1
        ? 'rounded-r-2xl'
        : ''}"
      on:click={() => onSelect(filter)}
    >
      {filter}
    </button>
  {/each}
</div>
