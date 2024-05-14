<script lang="ts">
  import { page } from '$app/stores';
</script>

<svelte:head>
  <title>Oops! Error - Immich</title>
</svelte:head>

<section class="flex flex-col px-4 h-screen w-screen place-content-center place-items-center">
  <h1 class="py-10 text-4xl text-immich-primary dark:text-immich-dark-primary">Page not found :/</h1>
  {#if $page.error?.message}
    <h2 class="text-xl text-immich-fg dark:text-immich-dark-fg">{$page.error.message}</h2>
  {/if}
</section>
