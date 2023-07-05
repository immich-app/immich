<script lang="ts">
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import LibrarySettings from '$lib/components/library-page/library-settings.svelte';
  import type { PageData } from './$types';

  export let data: PageData;
</script>

<UserPageLayout user={data.user} title={data.meta.title}>
  <section class="flex place-content-center mx-4">
    <div class="w-full max-w-3xl">
      <LibrarySettings library={data.library} />
    </div>
  </section>
</UserPageLayout>
