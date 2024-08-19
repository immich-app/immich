<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import FolderTree from '$lib/components/folder-tree/folder-tree.svelte';
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

<section id="folder-browser-sidebar">
  <p class="text-xs m-4 dark:text-white">FOLDER BROWSER</p>
  <div class="overflow-auto">
    {#each Object.entries(folderTree) as [folderName, content]}
      <FolderTree {folderName} {content} {currentPath} basePath="" />
    {/each}
  </div>
</section>
