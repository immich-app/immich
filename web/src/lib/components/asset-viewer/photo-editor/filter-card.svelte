<script lang="ts">
  export let title: string = 'Without';

  export let currentFilter: string;

  import Check from 'svelte-material-icons/Check.svelte';
</script>

<button
  class=" text-immich-gray/70 w-fit text-center text-sm {title.toLowerCase() === currentFilter ? 'isActive' : ''}"
  on:click={() => {
    if (title === 'Custom') {
      return;
    }
    currentFilter = title.toLowerCase();
  }}
>
  {#if title.toLowerCase() === currentFilter}
    <div class="bg-immich-primary flex h-[92px] w-[92px] items-center justify-center text-3xl">
      <Check />
    </div>
  {:else}
    <img class="bg-immich-gray/10 h-[92px] w-[92px]" src="" alt="asset preview" />
  {/if}
  <div class="my-[4px]">{title}</div>
</button>

<style>
  .isActive {
    color: white;
  }
</style>
