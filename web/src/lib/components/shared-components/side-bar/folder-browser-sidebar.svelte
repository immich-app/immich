<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import FolderBrowser from '$lib/components/folder-browser/folder-browser.svelte';
  import { buildFolderTree, type RecursiveObject } from '$lib/utils/folder-utils';
  import { foldersStore } from '$lib/stores/folders.store';
  import { get } from 'svelte/store';

  let folderTree: RecursiveObject = {};
  let currentPath = '';

  onMount(async () => {
    await foldersStore.fetchUniquePaths();
  });

  $: {
    const { uniquePaths } = get(foldersStore);
    if (uniquePaths && uniquePaths.length > 0) {
      folderTree = buildFolderTree(uniquePaths);
    }
  }

  $: {
    page.subscribe(($page) => {
      currentPath = $page.url.pathname.replace('/folders', '').split('/').filter(Boolean).join('/');
    });
  }
</script>

<div class="pl-8">
  {#each Object.entries(folderTree) as [folderName, content]}
    <FolderBrowser {folderName} {content} {currentPath} basePath="" />
  {/each}
</div>
