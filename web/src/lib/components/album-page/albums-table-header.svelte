<script lang="ts">
  import { albumViewSettings } from '$lib/stores/preferences.store';
  import type { Sort } from '$lib/components/album-page/albums-list.svelte';

  export let option: Sort;

  const handleSort = () => {
    if ($albumViewSettings.sortBy === option.title) {
      $albumViewSettings.sortDesc = !option.sortDesc;
      option.sortDesc = !option.sortDesc;
    } else {
      $albumViewSettings.sortBy = option.title;
    }
  };
</script>

<th class="{option.widthClass} text-sm font-medium"
  ><button
    class="rounded-lg p-2 hover:bg-immich-dark-primary hover:dark:bg-immich-dark-primary/50"
    on:click={() => handleSort()}
  >
    {#if $albumViewSettings.sortBy === option.title}
      {#if option.sortDesc}
        &#8595;
      {:else}
        &#8593;
      {/if}
    {/if}{option.title}</button
  ></th
>
