<script lang="ts">
  import { onMount } from 'svelte';
  import Folder from '$lib/components/folder-browser/Folder.svelte';
  import { getUniqueOriginalPaths } from '@immich/sdk';
  import { buildFolderTree, type RecursiveObject } from '$lib/utils/folder-utils';


  let folderTree: RecursiveObject = {};

  onMount(async () => {
    let data = await getUniqueOriginalPaths(); 
   
    if (data.length > 0) {
      folderTree = buildFolderTree(data);
    }
  });
</script>

<div class="pl-8">
  {#each Object.entries(folderTree) as [folderName, content]}
    <Folder {folderName} {content} />
  {/each}
</div>