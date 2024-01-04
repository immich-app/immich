<script lang="ts">
  export let options: {
    zone: string;
    offset: string;
  }[] = [];
  export let selectedOption: {
    zone: string;
    offset: string;
  };
  let isOpened = false;
</script>

<button
  class="text-sm my-4 text-left w-full bg-gray-200 p-3 rounded-lg dark:text-white dark:bg-gray-600"
  placeholder="Search timezone..."
  on:click={() => (isOpened = !isOpened)}
  >{selectedOption.zone}
</button>

{#if isOpened}
  <div class="absolute w-full h-32 overflow-auto dark:bg-gray-800">
    {#each options as option}
      <button
        class="block text-left w-full px-4 py-2 cursor-pointer hover:bg-gray-700"
        class:bg-gray-700={option.zone === selectedOption.zone}
        on:click={() => {
          selectedOption = option;
          isOpened = false;
        }}
      >
        {option.zone}
      </button>
    {/each}
  </div>
{/if}
