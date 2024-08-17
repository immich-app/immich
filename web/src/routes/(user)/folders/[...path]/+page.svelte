<script lang="ts">
  import type { PageData } from './$types';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import { onMount } from 'svelte';
  import Folder from '$lib/components/folder-browser/Folder.svelte';
  import { getAssetThumbnailUrl } from '$lib/utils';
  import { AssetMediaSize } from '@immich/sdk';

  export let data: PageData;

  let folderTree = {};

  function buildFolderTree(paths: string[]): any {
    const root = {};
    paths.forEach((path) => {
      const parts = path.split('/');
      let current = root;

      parts.forEach((part, index) => {
        if (!current[part]) {
          current[part] = { __assets: [] };
        }
        current = current[part];
        if (index === parts.length - 1) {
          current.__assets.push(path);
        }
      });
    });
    return root;
  }

  onMount(() => {
    if (data.paths.length > 0) {
      folderTree = buildFolderTree(data.paths);
    }
  });
</script>

<UserPageLayout title={data.meta.title}>
  <div>Click Folder Icon to Load Assets, click text to expand folder</div>

  <div class="content-container">
    <section class="folders-section">
      {#each Object.entries(folderTree) as [folderName, content]}
        <Folder {folderName} {content} />
      {/each}
    </section>
    <section class="images-section">
      {#each data.searchData as asset}
        <div class="image-container">
          <img
            src={getAssetThumbnailUrl({
              id: asset.id,
              size: AssetMediaSize.Thumbnail,
              checksum: asset.checksum,
            })}
          />
        </div>
      {/each}
    </section>
  </div>
</UserPageLayout>

<style>
  .content-container {
    display: flex;
    align-items: flex-start;
    gap: 20px;
  }

  .folders-section {
    flex: 0 0 30%;
  }

  .images-section {
    flex: 1;
  }

  .folders-section ul {
    padding-left: 20px;
  }

  .image-container {
    margin-bottom: 20px;
    display: flex;
    justify-content: center;
  }

  img {
    max-width: 100%;
    height: auto;
    /* filter: blur(20px); */
  }
</style>
