<script lang="ts">
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import { getAssetDuplicates, type AssetResponseDto } from '@immich/sdk';
  import DuplicatesCompareControl from '$lib/components/utilities-page/duplicates/duplicates-compare-control.svelte';

  import type { PageData } from './$types';
  export let data: PageData;
  let assets: AssetResponseDto[] = [];
</script>

<UserPageLayout title={data.meta.title} scrollbar={false}>
  <div class="flex gap-4 flex-wrap justify-around">
    {#each data.duplicates as duplicate (duplicate.duplicateId)}
      <DuplicatesCompareControl {duplicate} />
    {/each}
  </div>
</UserPageLayout>
