<script lang="ts">
  export let filters: string[];
  export let selected: string;

  export let onSelect: (selected: string) => void;
</script>

<div class=" flex bg-gray-100 dark:bg-gray-700 rounded-lg">
  {#each filters as filter, index}
    <button
      class="flex py-2 px-4 {filter === selected
        ? 'dark:bg-gray-900 bg-gray-300'
        : 'dark:hover:bg-gray-800 hover:bg-gray-200'}  {index === 0 ? 'rounded-l-lg' : ''} {index === filters.length - 1
        ? 'rounded-r-lg'
        : ''}"
      on:click={() => onSelect(filter)}
    >
      {filter}
    </button>
  {/each}
</div>
