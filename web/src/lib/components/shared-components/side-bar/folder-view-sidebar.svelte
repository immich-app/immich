<script lang="ts">
  import { onMount } from 'svelte';
  import Folder from '$lib/components/folder-browser/Folder.svelte';
  import { getUniqueOriginalPaths } from '@immich/sdk';
  import { buildFolderTree } from '$lib/utils/folder-utils';


  let folderTree: { [key: string]: any } = {};

  onMount(async () => {
    let data = await getUniqueOriginalPaths(); 
   
    if (data.length > 0) {
      folderTree = buildFolderTree(data);
    }
  });
</script>

<div class="folders-section">
  {#each Object.entries(folderTree) as [folderName, content]}
    <Folder {folderName} {content} />
  {/each}
</div>