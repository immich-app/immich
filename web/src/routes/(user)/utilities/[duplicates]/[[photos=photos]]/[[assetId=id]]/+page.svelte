<script lang="ts">
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import DuplicatesCompareControl from '$lib/components/utilities-page/duplicates/duplicates-compare-control.svelte';

  import type { PageData } from './$types';
  export let data: PageData;
</script>

<UserPageLayout title={data.meta.title + ` (${data.duplicates.length})`} scrollbar={true}>
  <div class="mt-6">
    {#each data.duplicates as duplicate (duplicate.duplicateId)}
      <DuplicatesCompareControl {duplicate} />
    {/each}
  </div>
</UserPageLayout>
