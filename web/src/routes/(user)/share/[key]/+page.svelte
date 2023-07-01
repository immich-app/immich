<script lang="ts">
  import AlbumViewer from '$lib/components/album-page/album-viewer.svelte';
  import IndividualSharedViewer from '$lib/components/share-page/individual-shared-viewer.svelte';
  import { AlbumResponseDto, SharedLinkType } from '@api';
  import type { PageData } from './$types';

  export let data: PageData;
  const { sharedLink } = data;

  let album: AlbumResponseDto | null = null;
  let isOwned = data.user ? data.user.id === sharedLink.userId : false;
  if (sharedLink.album) {
    album = { ...sharedLink.album, assets: sharedLink.assets };
  }
</script>

{#if sharedLink.type == SharedLinkType.Album && album}
  <div class="immich-scrollbar">
    <AlbumViewer {album} {sharedLink} />
  </div>
{/if}

{#if sharedLink.type == SharedLinkType.Individual}
  <div class="immich-scrollbar">
    <IndividualSharedViewer {sharedLink} {isOwned} />
  </div>
{/if}
