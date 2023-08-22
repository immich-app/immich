<script lang="ts">
  import AlbumViewer from '$lib/components/album-page/album-viewer.svelte';
  import IndividualSharedViewer from '$lib/components/share-page/individual-shared-viewer.svelte';
  import { SharedLinkType } from '@api';
  import type { PageData } from './$types';

  export let data: PageData;
  const { sharedLink } = data;

  let isOwned = data.user ? data.user.id === sharedLink.userId : false;
</script>

{#if sharedLink.type == SharedLinkType.Album}
  <AlbumViewer {sharedLink} />
{/if}

{#if sharedLink.type == SharedLinkType.Individual}
  <div class="immich-scrollbar">
    <IndividualSharedViewer {sharedLink} {isOwned} />
  </div>
{/if}
