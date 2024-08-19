<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import type { PageData } from './$types';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import { getAssetThumbnailUrl } from '$lib/utils';
  import { AssetMediaSize } from '@immich/sdk';
  import Thumbnail from '$lib/components/assets/thumbnail/image-thumbnail.svelte';
  import Icon from '$lib/components/elements/icon.svelte';
  import { mdiAccount, mdiArrowRight, mdiChevronRight, mdiFolder, mdiFolderArrowLeft } from '@mdi/js';

  export let data: PageData;

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

  $: pathSegments = data.path ? data.path.split('/') : [];
</script>

<UserPageLayout title={data.meta.title} isFolderView>
  {#if pathSegments.length > 0}
    <section
      id="path-summary"
      class="text-immich-primary dark:text-immich-dark-primary bg-gray-100 dark:bg-immich-dark-gray px-4 py-2 rounded-xl"
    >
      <div class="flex place-items-center gap-2">
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

  <section id="folder-detail-view" class="flex flex-wrap justify-start gap-4 mt-4">
    {#if data.path}
      <button
        class="flex flex-col items-center mb-4 cursor-pointer border rounded-xl"
        on:click|stopPropagation={handleBackNavigation}
      >
        <div class="flex justify-center items-center w-[350px] h-[350px]">
          <Icon path={mdiFolderArrowLeft} class="text-immich-primary dark:text-immich-dark-primary" size={96} />
        </div>
        <div class="my-2 text-center">Back</div>
      </button>
    {/if}

    {#each data.currentFolders as folder}
      <button
        class="flex flex-col items-center mb-4 cursor-pointer"
        on:click|stopPropagation={() => handleNavigation(folder)}
      >
        <div class="flex justify-center items-center w-[350px] h-[350px]">
          <span class="text-9xl">📁</span>
        </div>
        <div class="mt-2 text-center">{folder}</div>
      </button>
    {/each}

    {#if data.pathAssets}
      {#each data.pathAssets as asset}
        <div class="flex justify-center flex-[1_0_350px] max-w-[350px]">
          <Thumbnail
            url={getAssetThumbnailUrl({
              id: asset.id,
              size: AssetMediaSize.Thumbnail,
              checksum: asset.checksum,
            })}
            altText="Asset Thumbnail"
            widthStyle="100%"
          />
        </div>
      {/each}
    {/if}
  </section>
</UserPageLayout>
