<script lang="ts">
  import { goto } from '$app/navigation';
  import type { PageData } from './$types';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import { type AssetResponseDto } from '@immich/sdk';
  import Icon from '$lib/components/elements/icon.svelte';
  import { mdiArrowUpLeft, mdiChevronRight, mdiFolder } from '@mdi/js';
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import GalleryViewer from '$lib/components/shared-components/gallery-viewer/gallery-viewer.svelte';
  import type { Viewport } from '$lib/stores/assets.store';
  import { AppRoute } from '$lib/constants';

  export let data: PageData;

  let selectedAssets: Set<AssetResponseDto> = new Set();
  const viewport: Viewport = { width: 0, height: 0 };

  $: pathSegments = data.path ? data.path.split('/') : [];

  function handleNavigation(folderName: string) {
    const folderFullPath = `${data.path ? data.path + '/' : ''}${folderName}`.replace(/^\/|\/$/g, '');
    navigateToView(folderFullPath);
  }

  function handleBackNavigation() {
    if (data.path) {
      const parentPath = data.path.split('/').slice(0, -1).join('/');
      navigateToView(parentPath);
    }
  }

  function handleBreadcrumbNavigation(targetPath: string) {
    navigateToView(targetPath);
  }

  const navigateToView = (folderPath: string) => {
    const url = new URL(AppRoute.FOLDERS, window.location.href);
    url.searchParams.set('folder', folderPath);
    goto(url);
  };

  const loadNextPage = () => {};
</script>

<UserPageLayout title={data.meta.title} isFolderView>
  <section id="path-summary" class="text-immich-primary dark:text-immich-dark-primary rounded-xl flex">
    {#if data.path}
      <CircleIconButton icon={mdiArrowUpLeft} title="Back" on:click={handleBackNavigation} class="mr-2" padding="2" />
    {/if}
    <div
      class="flex place-items-center gap-2 bg-slate-50 dark:bg-immich-dark-gray/75 w-full py-2 px-4 rounded-2xl mr-4"
    >
      <Icon path={mdiFolder} class="text-immich-primary dark:text-immich-dark-primary" size={28} />
      {#each pathSegments as segment, index}
        <button
          class="text-sm font-mono underline hover:font-semibold"
          on:click={() => handleBreadcrumbNavigation(pathSegments.slice(0, index + 1).join('/'))}
        >
          {segment}
        </button>
        <p class="text-gray-500">
          {#if index < pathSegments.length - 1}
            <Icon path={mdiChevronRight} class="text-gray-500 dark:text-gray-300" size={16} />
          {/if}
        </p>
      {/each}
    </div>
  </section>

  <section id="folder-detail-view" class="mt-4">
    <!-- Sub Folders -->
    <div class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
      {#each data.currentFolders as subFolder}
        <button
          class="flex flex-col place-items-center gap-2 py-2 px-4 hover:bg-immich-primary/10 dark:hover:bg-immich-primary/40 rounded-xl"
          on:click={() => handleNavigation(subFolder)}
          title={subFolder}
        >
          <Icon path={mdiFolder} class="text-immich-primary dark:text-immich-dark-primary" size={64} />
          <p class="text-sm dark:text-gray-200 text-nowrap text-ellipsis overflow-clip w-full">{subFolder}</p>
        </button>
      {/each}
    </div>

    <!-- Assets -->
    <div
      bind:clientHeight={viewport.height}
      bind:clientWidth={viewport.width}
      class:mt-5={data.currentFolders.length > 0}
    >
      {#if data.pathAssets && data.pathAssets.length > 0}
        <GalleryViewer assets={data.pathAssets} bind:selectedAssets on:intersected={loadNextPage} {viewport} />
      {/if}
    </div>
  </section>
</UserPageLayout>
