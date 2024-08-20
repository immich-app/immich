<script lang="ts">
  import { goto } from '$app/navigation';
  import Icon from '$lib/components/elements/icon.svelte';
  import {
    mdiChevronDown,
    mdiChevronRight,
    mdiCircleSmall,
    mdiFolder,
    mdiFolderEye,
    mdiFolderEyeOutline,
    mdiFolderOpen,
    mdiFolderOpenOutline,
    mdiFolderOutline,
  } from '@mdi/js';
  import FolderBrowser from './folder-tree.svelte';

  // Exported props
  export let folderName: string;
  export let content: any;
  export let basePath: string;
  export let currentPath: string = '';

  let isExpanded = false;
  let currentFolderPath = `${basePath}/${folderName}`.replace(/^\//, '').replace(/\/$/, '');

  $: isExpanded = currentPath.startsWith(currentFolderPath);
  $: isOpened = currentPath === currentFolderPath;

  function toggleOpen(event: MouseEvent) {
    event.stopPropagation();
    isExpanded = !isExpanded;
  }

  function handleNavigation(event: MouseEvent) {
    event.preventDefault();
    goto(`/folders/${currentFolderPath}`);
  }
</script>

<button
  class={`flex place-items-center gap-1 pl-3 py-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg font-mono text-sm hover:font-semibold  w-full ${isOpened ? 'bg-slate-100 dark:bg-slate-700 font-semibold text-immich-primary dark:text-immich-dark-primary' : 'dark:text-gray-200'}`}
  on:click={toggleOpen}
  on:dblclick|stopPropagation={handleNavigation}
>
  <a href={`/folders/${currentFolderPath}`} on:click={handleNavigation} class="flex">
    <Icon
      path={isExpanded ? mdiChevronDown : mdiChevronRight}
      class={isExpanded ? 'text-immich-primary dark:text-immich-dark-primary' : 'text-gray-400 dark:text-gray-700'}
      size={20}
    />
    <Icon
      path={isOpened ? mdiFolderEye : isExpanded ? mdiFolder : mdiFolderOutline}
      class={isExpanded ? 'text-immich-primary dark:text-immich-dark-primary' : 'text-gray-400 dark:text-gray-700'}
      size={20}
    />
  </a>
  <button on:click={toggleOpen}>{folderName}</button>
</button>

{#if isExpanded}
  <ul class="list-none ml-2">
    {#each Object.entries(content) as [subFolderName, subContent]}
      <li class="my-1">
        <FolderBrowser folderName={subFolderName} content={subContent} basePath={currentFolderPath} {currentPath} />
      </li>
    {/each}
  </ul>
{/if}
