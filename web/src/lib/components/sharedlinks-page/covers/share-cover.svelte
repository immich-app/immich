<script lang="ts">
  import type { SharedLinkResponseDto } from '@immich/sdk';
  import AlbumCover from '$lib/components/album-page/album-cover.svelte';
  import NoCover from '$lib/components/sharedlinks-page/covers/no-cover.svelte';
  import AssetCover from '$lib/components/sharedlinks-page/covers/asset-cover.svelte';
  import { getAssetThumbnailUrl } from '$lib/utils';
  import { t } from 'svelte-i18n';

  interface Props {
    link: SharedLinkResponseDto;
    preload?: boolean;
    class?: string;
  }

  let { link, preload = false, class: className = '' }: Props = $props();
</script>

<div class="relative shrink-0 size-24">
  {#if link?.album}
    <AlbumCover album={link.album} class={className} {preload} />
  {:else if link.assets[0]}
    <AssetCover
      alt={$t('individual_share')}
      class={className}
      {preload}
      src={getAssetThumbnailUrl(link.assets[0].id)}
    />
  {:else}
    <NoCover alt={$t('unnamed_share')} class={className} {preload} />
  {/if}
</div>
