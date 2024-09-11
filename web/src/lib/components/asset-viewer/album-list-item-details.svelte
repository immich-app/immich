<script lang="ts">
  import type { AlbumResponseDto } from '@immich/sdk';
  import { t } from 'svelte-i18n';

  export let album: AlbumResponseDto;
</script>

<span>{$t('items_count', { values: { count: album.assetCount } })}</span>
{#if album.shared}
  <span>• {$t('shared')}</span>
{/if}
