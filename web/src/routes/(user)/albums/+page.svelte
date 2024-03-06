<script lang="ts">
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import type { PageData } from './$types';
  import AlbumsControls from '$lib/components/album-page/albums-controls.svelte';
  import Albums from '$lib/components/album-page/albums-list.svelte';

  export let data: PageData;
</script>

<UserPageLayout title={data.meta.title}>
  <div class="flex place-items-center gap-2" slot="buttons">
    <AlbumsControls />
  </div>
  <Albums albums={data.albums} />
</UserPageLayout>
