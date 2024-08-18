<script lang="ts">
  import type { PageData } from './$types';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import { getAssetThumbnailUrl } from '$lib/utils';
  import { AssetMediaSize } from '@immich/sdk';
  import Thumbnail from '$lib/components/assets/thumbnail/image-thumbnail.svelte';

  export let data: PageData;
</script>

<UserPageLayout title={data.meta.title}>
  <div>Click Folder Icon to Load Assets, click text to expand folder</div>
  <section class="flex flex-wrap justify-start gap-2.5">
    {#each data.pathAssets as asset}
      <div class="flex justify-center flex-[1_0_350px] max-w-[350px]">
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
