<script lang="ts">
  import type { Sort } from '../../../routes/(user)/albums/+page.svelte';

  export let albumViewSettings: string;
  export let option: Sort;

  const handleSort = () => {
    if (albumViewSettings === option.title) {
      option.sortDesc = !option.sortDesc;
    } else {
      albumViewSettings = option.title;
    }
  };
</script>

<th class="{option.widthClass} text-sm font-medium"
  ><button
    class="rounded-lg p-2 hover:bg-immich-dark-primary hover:dark:bg-immich-dark-primary/50"
    on:click={() => handleSort()}
  >
    {#if albumViewSettings === option.title}
      {#if option.sortDesc}
        &#8595;
      {:else}
        &#8593;
      {/if}
    {/if}{option.title}</button
  ></th
>
