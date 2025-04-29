<script lang="ts">
  import Icon from '$lib/components/elements/icon.svelte';
  import { getAssetThumbnailUrl } from '$lib/utils';
  import { getAssetResolution, getFileSize } from '$lib/utils/asset-utils';
  import { getAltText } from '$lib/utils/thumbnail-util';
  import { type AssetResponseDto, getAllAlbums } from '@immich/sdk';
  import { mdiHeart, mdiImageMultipleOutline, mdiMagnifyPlus } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    asset: AssetResponseDto;
    onViewAsset: (asset: AssetResponseDto) => void;
  }

  let { asset, onViewAsset }: Props = $props();

  let isFromExternalLibrary = $derived(!!asset.libraryId);
  let assetData = $derived(JSON.stringify(asset, null, 2));
</script>

<div
  class="max-w-60 rounded-xl border-4 transition-colors font-semibold text-xs bg-gray-200 dark:bg-gray-800 border-gray-200 dark:border-gray-800"
>
  <div class="relative w-full">
    <button type="button" onclick={() => onViewAsset(asset)} class="block relative w-full" aria-label={$t('keep')}>
      <!-- THUMBNAIL-->
      <img
        src={getAssetThumbnailUrl(asset.id)}
        alt={$getAltText(asset)}
        title={assetData}
        class="h-60 object-cover rounded-t-xl w-full"
        draggable="false"
      />

      <!-- FAVORITE ICON -->
      {#if asset.isFavorite}
        <div class="absolute bottom-2 start-2">
          <Icon path={mdiHeart} size="24" class="text-white" />
        </div>
      {/if}
    </button>
  </div>

  <div class="flex justify-between items-center pl-2">
    <div class="grid gap-y-2 py-2 text-xs transition-colors dark:text-white">
      <span class="break-all text-left">{asset.originalFileName}</span>
      <span>{getAssetResolution(asset)}</span>
      <span>
        {#await getAllAlbums({ assetId: asset.id })}
          {$t('scanning_for_album')}
        {:then albums}
          {#if albums.length === 0}
            {$t('not_in_any_album')}
          {:else}
            {$t('in_albums', { values: { count: albums.length } })}
          {/if}
        {/await}
      </span>
    </div>
    <div class="dark:text-white text-lg flex-grow text-center font-bold">
      {getFileSize(asset, 1)}
    </div>
  </div>
</div>
