<script lang="ts">
  import type { PageData } from './$types';
  import { albumViewSettings } from '$lib/stores/preferences.store';
  import { createAlbumAndRedirect } from '$lib/utils/album-utils';
  import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
  import AlbumsControls from '$lib/components/album-page/albums-controls.svelte';
  import Albums from '$lib/components/album-page/albums-list.svelte';
  import EmptyPlaceholder from '$lib/components/shared-components/empty-placeholder.svelte';

  export let data: PageData;

  let searchQuery = '';
  let albumGroups: string[] = [];
</script>

<UserPageLayout title={data.meta.title}>
  <div class="flex place-items-center gap-2" slot="buttons">
    <AlbumsControls {albumGroups} bind:searchQuery />
  </div>

  <Albums
    ownedAlbums={data.albums}
    sharedAlbums={data.sharedAlbums}
    userSettings={$albumViewSettings}
    allowEdit
    {searchQuery}
    bind:albumGroupIds={albumGroups}
  >
    <EmptyPlaceholder
      slot="empty"
      text="Create an album to organize your photos and videos"
      onClick={() => createAlbumAndRedirect()}
    />
  </Albums>
</UserPageLayout>
