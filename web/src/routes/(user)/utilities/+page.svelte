<script lang="ts">
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import type { PageData } from './$types';
  import EmptyPlaceholder from '$lib/components/shared-components/empty-placeholder.svelte';

  export let data: PageData;
</script>

<UserPageLayout title={data.meta.title}>
  <section>
    <EmptyPlaceholder slot="empty" text="Create an album to organize your photos and videos" />
  </section>
</UserPageLayout>
