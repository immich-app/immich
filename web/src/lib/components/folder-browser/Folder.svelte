<script lang="ts">
  import { goto } from '$app/navigation';
  import Folder from './Folder.svelte';

  // Exported props
  export let folderName: string;
  export let content: any;
  export let parentPath: string = '';

  let isOpen = false;

  function toggleOpen(event: MouseEvent) {
    event.stopPropagation();
    isOpen = !isOpen;
  }

  function handleNavigation(event: MouseEvent) {
    event.preventDefault();
    const folderFullPath = `${parentPath}/${folderName}`.replace(/^\//, '');
    goto(`/folders/${folderFullPath}`);
  }
</script>

<div>
  <div class="flex items-center font-bold my-1">
    <a href={`/folders${parentPath}/${folderName}`} on:click|preventDefault={handleNavigation}>
      <span class="mr-2" on:click|stopPropagation={handleNavigation}>📁</span>
    </a>
    <span on:click={toggleOpen}>{folderName}</span>
  </div>
  {#if isOpen}
    <ul class="list-none pl-2">
      {#each Object.entries(content) as [subFolderName, subContent]}
        <li class="my-1">
          <Folder folderName={subFolderName} content={subContent} parentPath={`${parentPath}/${folderName}`} />
        </li>
      {/each}
    </ul>
  {/if}
</div>