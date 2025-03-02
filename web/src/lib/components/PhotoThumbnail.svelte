<script lang="ts">
  import { thumbhash } from '$lib/actions/thumbhash';
  import ImageThumbnail from '$lib/components/assets/thumbnail/image-thumbnail.svelte';
  import { getAssetThumbnailUrl } from '$lib/utils';
  import { getAltText } from '$lib/utils/thumbnail-util';
  import { AssetMediaSize, type AssetResponseDto } from '@immich/sdk';
  import { fade } from 'svelte/transition';

  type Props = {
    asset: AssetResponseDto;
    width: number;
    height: number;
  };

  const { asset, width, height }: Props = $props();

  let loaded = $state(false);
</script>

{#if !loaded && asset.thumbhash}
  <canvas
    use:thumbhash={{ base64ThumbHash: asset.thumbhash }}
    class="absolute object-cover z-10"
    style:width="{width}px"
    style:height="{height}px"
    out:fade={{ duration: 150 }}
  ></canvas>
{/if}

<ImageThumbnail
  url={getAssetThumbnailUrl({ id: asset.id, size: AssetMediaSize.Thumbnail, cacheKey: asset.thumbhash })}
  altText={$getAltText(asset)}
  widthStyle="{width}px"
  heightStyle="{height}px"
  curve={false}
  onComplete={() => (loaded = true)}
/>
