<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import FolderTree from '$lib/components/folder-tree/folder-tree.svelte';
  import { buildFolderTree, type RecursiveObject } from '$lib/utils/folder-utils';
  import { foldersStore } from '$lib/stores/folders.store';
  import { get } from 'svelte/store';
  import { t } from 'svelte-i18n';

  let folderTree: RecursiveObject = {};
  $: currentPath = $page.url.searchParams.get('folder') || '';

  onMount(async () => {
    await foldersStore.fetchUniquePaths();
  });

  $: {
    const { uniquePaths } = get(foldersStore);
    if (uniquePaths && uniquePaths.length > 0) {
      folderTree = buildFolderTree(uniquePaths);
    }
  }
</script>

<section id="folder-browser-sidebar">
  <div class="text-xs pl-4 mb-4 dark:text-white">{$t('explorer').toUpperCase()}</div>
  <div class="overflow-auto pb-10">
    {#each Object.entries(folderTree) as [folderName, content]}
      <FolderTree {folderName} {content} {currentPath} basePath="" />
    {/each}
  </div>
</section>
