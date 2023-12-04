<script lang="ts">
  import type { PageData } from './$types';
  import AlbumList from '$lib/components/album-page/album-list.svelte';

  export let data: PageData;
</script>

<AlbumList
  albumsList={data.sharedAlbums}
  user={data.user}
  title={data.meta.title}
  sharedAlbum={true}
  partners={data.partners}
/>
