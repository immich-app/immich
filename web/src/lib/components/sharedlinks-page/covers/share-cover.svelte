<script lang="ts">
  import AlbumCover from '$lib/components/album-page/album-cover.svelte';
  import AssetCover from '$lib/components/sharedlinks-page/covers/asset-cover.svelte';
  import NoCover from '$lib/components/sharedlinks-page/covers/no-cover.svelte';
  import { getAssetThumbnailUrl } from '$lib/utils';
  import type { SharedLinkResponseDto } from '@immich/sdk';
  import { t } from 'svelte-i18n';

  interface Props {
    sharedLink: SharedLinkResponseDto;
    preload?: boolean;
    class?: string;
  }

  let { sharedLink, preload = false, class: className = '' }: Props = $props();
</script>

<div class="relative shrink-0 size-22">
  {#if sharedLink?.album}
    <AlbumCover album={sharedLink.album} class={className} {preload} />
  {:else if sharedLink.assets[0]}
    <AssetCover
      alt={$t('individual_share')}
      class={className}
      {preload}
      src={getAssetThumbnailUrl(sharedLink.assets[0].id)}
    />
  {:else}
    <NoCover alt={$t('unnamed_share')} class={className} {preload} />
  {/if}
</div>
