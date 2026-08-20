<script lang="ts">
  import AssetCover from '$lib/components/sharedlinks-page/covers/AssetCover.svelte';
  import NoCover from '$lib/components/sharedlinks-page/covers/NoCover.svelte';
  import { getAssetMediaUrl } from '$lib/utils';
  import { type AlbumResponseDto } from '@immich/sdk';
  import { Icon } from '@immich/ui';
  import { mdiPin } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    album: AlbumResponseDto;
    preload?: boolean;
    class?: string;
  }

  let { album, preload = false, class: className }: Props = $props();

  let alt = $derived(album.albumName || $t('unnamed_album'));
  let thumbnailUrl = $derived(
    album.albumThumbnailAssetId ? getAssetMediaUrl({ id: album.albumThumbnailAssetId }) : null,
  );
</script>

<div class="relative">
  {#if thumbnailUrl}
    <AssetCover {alt} class={className} src={thumbnailUrl} {preload} />
  {:else}
    <NoCover {alt} class={className} {preload} />
  {/if}

  {#if album.isPinned}
    <span
      class="absolute top-1.5 right-1.5 z-10 rounded-full bg-white/90 p-0.5 shadow-sm"
      title={$t('pinned_album')}
    >
      <Icon icon={mdiPin} size="1em" />
    </span>
  {/if}
</div>
