<script lang="ts">
  import Icon from '$lib/components/elements/icon.svelte';
  import { getAssetThumbnailUrl } from '$lib/utils';
  import { getAssetResolution, getFileSize } from '$lib/utils/asset-utils';
  import { getAltText } from '$lib/utils/thumbnail-util';
  import { getAllAlbums, type AssetResponseDto } from '@immich/sdk';
  import { mdiMagnifyPlus } from '@mdi/js';
  import { t } from 'svelte-i18n';

  export let asset: AssetResponseDto;
  export let isSelected: boolean;
  export let onSelectAsset: (asset: AssetResponseDto) => void;
  export let onViewAsset: (asset: AssetResponseDto) => void;

  $: isFromExternalLibrary = !!asset.libraryId;
  $: assetData = JSON.stringify(asset, null, 2);
</script>

<div class="relative">
  <div class="relative">
    <button
      type="button"
      on:click={() => onSelectAsset(asset)}
      class="block relative rounded-t-xl"
      aria-pressed={isSelected}
      aria-label={$t('keep')}
    >
      <!-- THUMBNAIL-->
      <img
        src={getAssetThumbnailUrl(asset.id)}
        alt={getAltText(asset)}
        title={`${assetData}`}
        class={`size-60 object-cover rounded-t-xl border-4 border-b-0 border-gray-300 ${isSelected ? 'border-immich-primary dark:border-immich-dark-primary' : 'dark:border-gray-800'} transition-all`}
        draggable="false"
      />

      <!-- OVERLAY CHIP -->
      <div
        class={`absolute bottom-2 right-3 ${isSelected ? 'bg-green-400/90' : 'bg-red-300/90'} px-4 py-1 rounded-xl text-xs font-semibold`}
      >
        {isSelected ? $t('keep') : $t('to_trash')}
      </div>

      <!-- EXTERNAL LIBRARY CHIP-->
      {#if isFromExternalLibrary}
        <div class="absolute top-2 right-3 bg-immich-primary/90 px-4 py-1 rounded-xl text-xs font-semibold text-white">
          {$t('external')}
        </div>
      {/if}
    </button>

    <button
      type="button"
      on:click={() => onViewAsset(asset)}
      class="absolute rounded-full bottom-1 left-2 text-gray-200 p-1.5 hover:text-white bg-black/35"
      title={$t('view')}
    >
      <Icon ariaLabel={$t('view')} path={mdiMagnifyPlus} flipped />
    </button>
  </div>

  <!-- ASSET INFO-->
  <table
    class={`text-xs w-full rounded-b-xl font-semibold ${isSelected ? 'bg-immich-primary text-white dark:bg-immich-dark-primary dark:text-black' : 'bg-gray-200 dark:bg-gray-800 dark:text-white'} mt-0 transition-all`}
  >
    <tr
      class={`h-8 ${isSelected ? 'border-immich-primary rounded-xl dark:border-immich-dark-primary' : 'border-gray-300'} text-center `}
    >
      <td>{asset.originalFileName}</td>
    </tr>

    <tr
      class={`h-8 ${isSelected ? 'border-immich-primary rounded-xl dark:border-immich-dark-primary' : 'border-gray-300'} text-center`}
    >
      <td>{getAssetResolution(asset)} - {getFileSize(asset)}</td>
    </tr>

    <tr
      class={`h-8 ${isSelected ? 'border-immich-primary rounded-xl dark:border-immich-dark-primary' : 'border-gray-300'} text-center `}
    >
      <td>
        {#await getAllAlbums({ assetId: asset.id })}
          {$t('scanning_for_album')}
        {:then albums}
          {#if albums.length === 0}
            {$t('not_in_any_album')}
          {:else}
            {$t('in_albums', { values: { count: albums.length } })}
          {/if}
        {/await}
      </td>
    </tr>
  </table>
</div>
