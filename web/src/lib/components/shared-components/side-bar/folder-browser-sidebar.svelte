<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import FolderBrowser from '$lib/components/folder-browser/folder-browser.svelte';
  import { getUniqueOriginalPaths } from '@immich/sdk';
  import { buildFolderTree, type RecursiveObject } from '$lib/utils/folder-utils';

  let folderTree: RecursiveObject = {};
  let currentPath = '';

  onMount(async () => {
    let data = await getUniqueOriginalPaths(); 
    if (data.length > 0) {
      folderTree = buildFolderTree(data);
    }
  });

  $: {
    page.subscribe(($page) => {
      currentPath = $page.url.pathname.replace('/folders', '').split('/').filter(Boolean).join('/');
    });
  }
</script>

<div class="pl-8">
  {#each Object.entries(folderTree) as [folderName, content]}
    <FolderBrowser {folderName} {content} currentPath={currentPath} basePath="" />
  {/each}
</div>
