<script lang="ts">
  import { goto } from '$app/navigation';
  import Icon from '$lib/components/elements/icon.svelte';
  import { mdiCircleSmall, mdiDotsCircle, mdiFolder, mdiFolderArrowDown } from '@mdi/js';
  import FolderBrowser from './folder-tree.svelte';

  // Exported props
  export let folderName: string;
  export let content: any;
  export let basePath: string;
  export let currentPath: string = '';

  let isOpen = false;
  let currentFolderPath = `${basePath}/${folderName}`.replace(/^\//, '').replace(/\/$/, '');

  $: isOpen = currentPath.startsWith(currentFolderPath);
  $: isCurrentFolder = currentPath === currentFolderPath;

  function toggleOpen(event: MouseEvent) {
    event.stopPropagation();
    isOpen = !isOpen;
  }

  function handleNavigation(event: MouseEvent) {
    event.preventDefault();
    goto(`/folders/${currentFolderPath}`);
  }
</script>

<button
  class={`flex items-center pl-4 pt-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg font-mono text-sm hover:font-semibold hover:text-immich-primary dark:hover:text-immich-dark-primary w-full ${isCurrentFolder ? 'bg-slate-100 dark:bg-slate-700 font-semibold' : ''}`}
  on:click={toggleOpen}
  on:dblclick|stopPropagation={handleNavigation}
>
  <a href={`/folders/${currentFolderPath}`} on:click|preventDefault={handleNavigation}>
    <button class="mr-2" on:click|stopPropagation={handleNavigation}
      ><Icon
        path={isOpen ? mdiFolderArrowDown : mdiFolder}
        class={isOpen ? 'text-immich-primary dark:text-immich-dark-primary' : 'text-gray-400 dark:text-gray-800'}
        size={24}
      /></button
    >
  </a>
  <button class="dark:text-immich-gray" on:click={toggleOpen}>{folderName}</button>
  {#if isCurrentFolder}
    <Icon path={mdiCircleSmall} class={'ml-[2px] text-immich-primary dark:text-immich-dark-primary'} size={24} />
  {/if}
</button>

{#if isOpen}
  <ul class="list-none ml-2">
    {#each Object.entries(content) as [subFolderName, subContent]}
      <li class="my-1">
        <FolderBrowser folderName={subFolderName} content={subContent} basePath={currentFolderPath} {currentPath} />
      </li>
    {/each}
  </ul>
{/if}
