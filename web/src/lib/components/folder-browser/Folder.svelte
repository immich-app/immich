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

<div class="folder">
  <div class="folder-name">
    <a href={`/folders${parentPath}/${folderName}`} on:click|preventDefault={handleNavigation}>
      <span class="folder-icon" on:click|stopPropagation={handleNavigation}>📁</span>
    </a>
    <span class="folder-name-text" on:click={toggleOpen}>{folderName}</span>
  </div>
  {#if isOpen}
    <ul>
      {#each Object.entries(content) as [subFolderName, subContent]}
        {#if subFolderName !== '__assets'}
          <li>
            <Folder folderName={subFolderName} content={subContent} parentPath={`${parentPath}/${folderName}`} />
          </li>
        {:else}
          {#each content.__assets as asset}
            <li>
              {asset.originalPath}
            </li>
          {/each}
        {/if}
      {/each}
    </ul>
  {/if}
</div>

<style>
  .folder-name {
    cursor: pointer;
    font-weight: bold;
    margin: 5px 0;
    display: flex;
    align-items: center;
  }
  .folder-icon {
    margin-right: 5px;
    cursor: pointer;
  }
  .folder-name-text {
    cursor: pointer;
  }
  ul {
    list-style: none;
    padding-left: 20px;
  }
  li {
    margin: 5px 0;
  }
</style>
