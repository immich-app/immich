<script lang="ts" context="module">
  export interface Sort {
    title: string;
    sortDesc: boolean;
    widthClass: string;
    sortFn: (reverse: boolean, albums: AlbumResponseDto[]) => AlbumResponseDto[];
  }
</script>

<script lang="ts">
  import type { PageData } from './$types';

  import type { AlbumResponseDto } from '@api';

  import AlbumList from '$lib/components/album-page/album-list.svelte';

  export let data: PageData;
</script>

<AlbumList albumsList={data.albums} user={data.user} title={data.meta.title} sharedAlbum={false} />
