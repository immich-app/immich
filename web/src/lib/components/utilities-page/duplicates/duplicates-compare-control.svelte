<script lang="ts">
  import Button from '$lib/components/elements/buttons/button.svelte';
  import Icon from '$lib/components/elements/icon.svelte';
  import { getAssetThumbnailUrl } from '$lib/utils';
  import { ThumbnailFormat, type AssetResponseDto, type DuplicateResponseDto, getAllAlbums } from '@immich/sdk';
  import { mdiCheck, mdiTrashCanOutline } from '@mdi/js';
  import { onMount } from 'svelte';
  import { s } from '$lib/utils';
  import { getAssetResolution, getFileSize } from '$lib/utils/asset-utils';
  import { sortBy } from 'lodash-es';

  export let duplicate: DuplicateResponseDto;
  export let onResolve: (duplicateAssetIds: string[], trashIds: string[]) => void;

  let selectedAssetIds = new Set<string>();

  $: trashCount = duplicate.assets.length - selectedAssetIds.size;

  onMount(() => {
    const suggestedAsset = sortBy(duplicate.assets, (asset) => asset.exifInfo?.fileSizeInByte).pop();

    if (!suggestedAsset) {
      selectedAssetIds = new Set(duplicate.assets[0].id);
      return;
    }

    selectedAssetIds.add(suggestedAsset.id);
    selectedAssetIds = selectedAssetIds;
  });

  const onSelectAsset = (asset: AssetResponseDto) => {
    if (selectedAssetIds.has(asset.id)) {
      selectedAssetIds.delete(asset.id);
    } else {
      selectedAssetIds.add(asset.id);
    }

    selectedAssetIds = selectedAssetIds;
  };

  const handleResolve = () => {
    const trashIds = duplicate.assets.map((asset) => asset.id).filter((id) => !selectedAssetIds.has(id));
    const duplicateAssetIds = duplicate.assets.map((asset) => asset.id);
    onResolve(duplicateAssetIds, trashIds);
  };
</script>

<div class="pt-4 rounded-3xl border dark:border-2 border-gray-300 dark:border-gray-700 max-w-[900px] m-auto mb-16">
  <div class="flex flex-wrap gap-1 place-items-center place-content-center px-4 pt-4">
    {#each duplicate.assets as asset, index (index)}
      {@const isSelected = selectedAssetIds.has(asset.id)}
      {@const isFromExternalLibrary = !!asset.libraryId}
      {@const assetData = JSON.stringify(asset, null, 2)}

      <div class="relative">
        <button type="button" on:click={() => onSelectAsset(asset)} class="block relative">
          <!-- THUMBNAIL-->
          <img
            src={getAssetThumbnailUrl(asset.id, ThumbnailFormat.Webp)}
            alt={asset.id}
            title={`${assetData}`}
            class={`w-[250px] h-[250px] object-cover rounded-t-xl border-t-[4px] border-l-[4px] border-r-[4px] border-gray-300 ${isSelected ? 'border-immich-primary dark:border-immich-dark-primary' : 'dark:border-gray-800'} transition-all`}
            draggable="false"
          />

          <!-- OVERLAY CHIP -->
          <div
            class={`absolute bottom-2 right-3 ${isSelected ? 'bg-green-400/90' : 'bg-red-300/90'} px-4 py-1 rounded-xl text-xs font-semibold`}
          >
            {isSelected ? 'Keep' : 'Trash'}
          </div>

          <!-- EXTERNAL LIBRARY CHIP-->
          {#if isFromExternalLibrary}
            <div
              class="absolute top-2 right-3 bg-immich-primary/90 px-4 py-1 rounded-xl text-xs font-semibold text-white"
            >
              External
            </div>
          {/if}
        </button>

        <!-- ASSET INFO-->
        <table
          class={`text-xs w-full rounded-b-xl font-semibold ${isSelected ? 'bg-immich-primary text-white dark:bg-immich-dark-primary dark:text-black' : 'bg-gray-200 dark:bg-gray-800 dark:text-white'} mt-0 transition-all`}
        >
          <tr
            class={`h-[32px] ${isSelected ? 'border-immich-primary rounded-xl dark:border-immich-dark-primary' : 'border-gray-300'} text-center `}
          >
            <td>{asset.originalFileName}</td>
          </tr>

          <tr
            class={`h-[32px] ${isSelected ? 'border-immich-primary rounded-xl dark:border-immich-dark-primary' : 'border-gray-300'} text-center`}
          >
            <td>{getAssetResolution(asset)} - {getFileSize(asset)}</td>
          </tr>

          <tr
            class={`h-[32px] ${isSelected ? 'border-immich-primary rounded-xl dark:border-immich-dark-primary' : 'border-gray-300'} text-center `}
          >
            <td>
              {#await getAllAlbums({ assetId: asset.id })}
                Scanning for album...
              {:then albums}
                {#if albums.length === 0}
                  Not in any album
                {:else}
                  In {albums.length} album{s(albums.length)}
                {/if}
              {/await}
            </td>
          </tr>
        </table>
      </div>
    {/each}
  </div>

  <!-- CONFIRM BUTTONS -->
  <div class="flex gap-4 my-4 border-transparent w-full justify-end p-4 h-[85px]">
    {#if trashCount === 0}
      <Button size="sm" color="primary" class="flex place-items-center gap-2" on:click={handleResolve}
        ><Icon path={mdiCheck} size="20" />Keep All
      </Button>
    {:else}
      <Button size="sm" color="red" class="flex place-items-center gap-2" on:click={handleResolve}
        ><Icon path={mdiTrashCanOutline} size="20" />{trashCount === duplicate.assets.length
          ? 'Trash All'
          : `Trash ${trashCount}`}
      </Button>
    {/if}
  </div>
</div>
