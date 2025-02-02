<script lang="ts">
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import DuplicateThumbnail from '$lib/components/utilities-page/duplicates/duplicate-thumbnail.svelte';
  import { locale } from '$lib/stores/preferences.store';
  import type { PageData } from './$types';

  interface Props {
    data: PageData;
  }

  let { data = $bindable() }: Props = $props();

  let duplicates = $state(data.duplicates);
</script>

<UserPageLayout title={data.meta.title + ` (${duplicates.length.toLocaleString($locale)})`} scrollbar={true}>
  <section class="mt-2 h-[calc(100%-theme(spacing.20))] overflow-auto immich-scrollbar">
    <div class="w-full grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 2xl:grid-cols-8 gap-2 rounded-2xl">
      {#each duplicates as duplicate}
        <DuplicateThumbnail {duplicate} />
      {/each}
    </div>
  </section>
</UserPageLayout>
