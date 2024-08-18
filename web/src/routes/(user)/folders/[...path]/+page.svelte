<!-- src/routes/(user)/folders/folder/[...path]/+page.svelte -->
<script lang="ts">
  import type { PageData } from './$types';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import Folder from '$lib/components/folder-browser/Folder.svelte';
  import { getAssetThumbnailUrl } from '$lib/utils';
  import { AssetMediaSize } from '@immich/sdk';
  import Thumbnail from '$lib/components/assets/thumbnail/image-thumbnail.svelte';

  export let data: PageData;
</script>

<UserPageLayout title={data.meta.title}>
  <div>Click Folder Icon to Load Assets, click text to expand folder</div>
  <section class="images-section">
    {#each data.searchData as asset}
      <div class="image-container">
        <Thumbnail
          url={getAssetThumbnailUrl({
            id: asset.id,
            size: AssetMediaSize.Thumbnail,
            checksum: asset.checksum,
          })}
          altText="testing"
          widthStyle="100%"
        />
      </div>
    {/each}
  </section>
</UserPageLayout>

<style>
  .images-section {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-start;
    gap: 10px;
  }

  .image-container {
    flex: 1 0 350px;
    display: flex;
    justify-content: center;
    max-width: 350px;
  }

</style>
