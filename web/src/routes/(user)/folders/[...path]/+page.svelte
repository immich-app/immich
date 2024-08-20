<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import type { PageData } from './$types';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import { getAssetThumbnailUrl } from '$lib/utils';
  import { AssetMediaSize, type AssetResponseDto } from '@immich/sdk';
  import Thumbnail from '$lib/components/assets/thumbnail/image-thumbnail.svelte';
  import Icon from '$lib/components/elements/icon.svelte';
  import {
    mdiAccount,
    mdiArrowLeft,
    mdiArrowRight,
    mdiChevronLeft,
    mdiChevronRight,
    mdiFolder,
    mdiFolderArrowLeft,
  } from '@mdi/js';
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import Button from '$lib/components/elements/buttons/button.svelte';
  import GalleryViewer from '$lib/components/shared-components/gallery-viewer/gallery-viewer.svelte';
  import type { Viewport } from '$lib/stores/assets.store';

  export let data: PageData;
  let selectedAssets: Set<AssetResponseDto> = new Set();
  const viewport: Viewport = { width: 0, height: 0 };

  $: pathSegments = data.path ? data.path.split('/') : [];

  function handleNavigation(folderName: string) {
    const folderFullPath = `${data.path ? data.path + '/' : ''}${folderName}`.replace(/^\/|\/$/g, '');
    goto(`/folders/${folderFullPath}`);
  }

  function handleBackNavigation() {
    if (data.path) {
      const parentPath = data.path.split('/').slice(0, -1).join('/');
      goto(`/folders/${parentPath}`);
    }
  }

  function handleBreadcrumbNavigation(targetPath: string) {
    goto(`/folders/${targetPath}`);
  }

  const loadNextPage = () => {};
</script>

<UserPageLayout title={data.meta.title} isFolderView>
  {#if pathSegments.length > 0}
    <section id="path-summary" class="text-immich-primary dark:text-immich-dark-primary rounded-xl flex">
      {#if data.path}
        <CircleIconButton icon={mdiChevronLeft} title="Back" on:click={handleBackNavigation} class="mr-2" padding="2" />
      {/if}
      <div class="flex place-items-center gap-2 bg-gray-100 dark:bg-immich-dark-gray w-full py-2 px-4 rounded-2xl mr-4">
        <Icon path={mdiFolder} class="text-immich-primary dark:text-immich-dark-primary" size={28} />
        {#each pathSegments as segment, index}
          <button
            class="text-sm font-mono underline"
            on:click|preventDefault={() => handleBreadcrumbNavigation(pathSegments.slice(0, index + 1).join('/'))}
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
  {/if}

  <section id="folder-detail-view" class="mt-4">
    <!-- Sub Folders -->
    <div class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2 flex-wrap">
      {#each data.currentFolders as subFolder}
        <button
          class="flex flex-col place-items-center rounded-xl gap-2 py-2 px-4 hover:bg-immich-primary/10 dark:hover:bg-immich-primary/40"
          on:click={() => handleNavigation(subFolder)}
        >
          <Icon path={mdiFolder} class="text-immich-primary dark:text-immich-dark-primary text-center" size={64} />
          <p class="text-sm dark:text-gray-200">{subFolder}</p>
        </button>
      {/each}
    </div>

    <!-- Assets -->
    <div bind:clientHeight={viewport.height} bind:clientWidth={viewport.width}>
      {#if data.pathAssets && data.pathAssets.length > 0}
        {#each data.pathAssets as asset}
          {asset.resized}
        {/each}
        <GalleryViewer assets={data.pathAssets} bind:selectedAssets on:intersected={loadNextPage} {viewport} />
      {/if}

      {#if data.pathAssets}
        {#each data.pathAssets as asset}
          <div class="flex justify-center flex-[1_0_350px] max-w-[350px]">
            <Thumbnail
              url={getAssetThumbnailUrl({
                id: asset.id,
              })}
              altText="Asset Thumbnail"
              widthStyle="50%"
            />
          </div>
        {/each}
      {/if}
    </div>
  </section>
</UserPageLayout>
