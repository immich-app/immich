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

      <!--  should be unnecceary, stacks are probably best ignored in large assets viewer -->
      <!-- EXTERNAL LIBRARY / STACK COUNT CHIP -->
      <div class="absolute top-2 end-3">
        {#if isFromExternalLibrary}
          <div class="bg-immich-primary/90 px-2 py-1 rounded-xl text-xs text-white">
            {$t('external')}
          </div>
        {/if}
        {#if asset.stack?.assetCount}
          <div class="bg-immich-primary/90 px-2 py-1 my-0.5 rounded-xl text-xs text-white">
            <div class="flex items-center justify-center">
              <div class="me-1">{asset.stack.assetCount}</div>
              <Icon path={mdiImageMultipleOutline} size="18" />
            </div>
          </div>
        {/if}
      </div>
    </button>
  </div>

  <div class="grid place-items-center gap-y-2 py-2 text-xs transition-colors dark:text-white">
    <span class="break-all text-center">{asset.originalFileName}</span>
    <span>{getAssetResolution(asset)} - {getFileSize(asset)}</span>
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
</div>
