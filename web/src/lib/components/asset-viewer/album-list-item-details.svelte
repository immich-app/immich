<script lang="ts">
  import type { AlbumResponseDto } from '@immich/sdk';

  export let album: AlbumResponseDto;
</script>

<span>{album.assetCount} items</span>
{#if album.shared}
  <span>• Shared</span>
{/if}
