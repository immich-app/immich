<script lang="ts">
  import { goto } from '$app/navigation';
  import Icon from '$lib/components/elements/icon.svelte';
  import { mdiChevronDown, mdiChevronRight, mdiFolder, mdiFolderEye, mdiFolderOutline } from '@mdi/js';
  import FolderBrowser from './folder-tree.svelte';
  import { AppRoute } from '$lib/constants';
  import type { RecursiveObject } from '$lib/utils/folder-utils';

  // Exported props
  export let folderName: string;
  export let content: RecursiveObject;
  export let basePath: string;
  export let currentPath: string = '';

  let isExpanded = false;
  let currentFolderPath = `${basePath}/${folderName}`.replace(/^\//, '').replace(/\/$/, '');

  $: isExpanded = currentPath.startsWith(currentFolderPath);
  $: isOpened = currentPath === currentFolderPath;

  function toggleExpand(event: MouseEvent) {
    event.stopPropagation();
    isExpanded = !isExpanded;
  }

  const handleNavigation = async () => {
    const url = new URL(AppRoute.FOLDERS, window.location.href);
    url.searchParams.set('folder', currentFolderPath);
    await goto(url);
  };
</script>

<button
  class={`flex place-items-center gap-1 mt-1 px-3 py-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg font-mono text-sm hover:font-semibold ${isOpened ? 'bg-slate-100 dark:bg-slate-700 font-semibold text-immich-primary dark:text-immich-dark-primary' : 'dark:text-gray-200'}`}
  on:click={toggleExpand}
  on:dblclick|stopPropagation|preventDefault={handleNavigation}
  title={folderName}
  type="button"
>
  <a href={`${AppRoute.FOLDERS}?folder=${currentFolderPath}`} on:click|preventDefault={handleNavigation} class="flex">
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
  <button on:click={toggleExpand} type="button">
    <p class="text-nowrap overflow-clip">{folderName}</p>
  </button>
</button>

{#if isExpanded}
  <ul class="list-none ml-2">
    {#each Object.entries(content) as [subFolderName, subContent], index (index)}
      <li class="my-1">
        <FolderBrowser folderName={subFolderName} content={subContent} basePath={currentFolderPath} {currentPath} />
      </li>
    {/each}
  </ul>
{/if}
