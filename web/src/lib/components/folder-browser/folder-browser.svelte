<script lang="ts">
  import { goto } from '$app/navigation';
  import FolderBrowser from './folder-browser.svelte';

  // Exported props
  export let folderName: string;
  export let content: any;
  export let basePath: string;
  export let currentPath: string = '';

  let isOpen = false;
  let currentFolderPath = `${basePath}/${folderName}`.replace(/^\//, '').replace(/\/$/, '');

  $: isOpen = currentPath.startsWith(currentFolderPath);

  function toggleOpen(event: MouseEvent) {
    event.stopPropagation();
    isOpen = !isOpen;
  }

  function handleNavigation(event: MouseEvent) {
    event.preventDefault();
    goto(`/folders/${currentFolderPath}`);
  }
</script>

<div>
  <div class="flex items-center font-bold my-1">
    <a href={`/folders/${currentFolderPath}`} on:click|preventDefault={handleNavigation}>
      <span class="mr-2" on:click|stopPropagation={handleNavigation}>📁</span>
    </a>
    <span on:click={toggleOpen}>{folderName}</span>
  </div>
  {#if isOpen}
    <ul class="list-none pl-2">
      {#each Object.entries(content) as [subFolderName, subContent]}
        <li class="my-1">
          <FolderBrowser folderName={subFolderName} content={subContent} basePath={currentFolderPath} currentPath={currentPath} />
        </li>
      {/each}
    </ul>
  {/if}
</div>
