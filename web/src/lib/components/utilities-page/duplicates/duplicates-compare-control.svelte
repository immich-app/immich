<script lang="ts">
  import Button from '$lib/components/elements/buttons/button.svelte';
  import Icon from '$lib/components/elements/icon.svelte';
  import { locale } from '$lib/stores/preferences.store';
  import { getAssetThumbnailUrl } from '$lib/utils';
  import { asByteUnitString } from '$lib/utils/byte-units';
  import { ThumbnailFormat, type AssetResponseDto, type DuplicateResponseDto } from '@immich/sdk';
  import {
    mdiCheck,
    mdiCheckOutline,
    mdiImageCheckOutline,
    mdiImageMultipleOutline,
    mdiTrashCan,
    mdiTrashCanOutline,
  } from '@mdi/js';
  import { onMount } from 'svelte';

  export let duplicate: DuplicateResponseDto;
  export let onResolve: (keepIds: string[], trashIds: string[]) => void;

  let selectedAsset = new Set<string>();
  $: trashCount = duplicate.assets.length - selectedAsset.size;

  onMount(() => {
    const suggestedAsset = duplicate.assets.sort(
      (a, b) => b.exifInfo!.fileSizeInByte! - a.exifInfo!.fileSizeInByte!,
    )[0];

    selectedAsset.add(suggestedAsset.id);
    selectedAsset = new Set(selectedAsset);
  });

  const onSelectAsset = (asset: AssetResponseDto) => {
    if (selectedAsset.has(asset.id)) {
      selectedAsset.delete(asset.id);
    } else {
      selectedAsset.add(asset.id);
    }

    selectedAsset = new Set(selectedAsset);
  };

  const handleOnResolve = () => {
    const keepIds = Array.from(selectedAsset);
    const trashIds = duplicate.assets.map((asset) => asset.id).filter((id) => !keepIds.includes(id));

    onResolve(keepIds, trashIds);
  };
</script>

<div class="pt-4 rounded-3xl border dark:border-2 border-gray-300 dark:border-gray-700 max-w-[900px] m-auto mb-16">
  <div class="flex flex-wrap gap-1 place-items-center place-content-center px-4 pt-4">
    {#each duplicate.assets as asset, index (index)}
      {@const isSelected = selectedAsset.has(asset.id)}

      <div class="relative">
        <button on:click={() => onSelectAsset(asset)} class="block relative">
          <!-- THUMBNAIL-->
          <img
            src={getAssetThumbnailUrl(asset.id, ThumbnailFormat.Webp)}
            alt={asset.id}
            title={`assetId: ${asset.id}`}
            class={`w-[250px] h-[250px] object-cover rounded-t-xl border-t-[4px] border-l-[4px] border-r-[4px] border-gray-300 ${isSelected ? 'border-immich-primary dark:border-immich-dark-primary' : 'dark:border-gray-800'} transition-all`}
            draggable="false"
          />

          <!-- OVERLAY CHIP -->
          <div
            class={`absolute bottom-2 right-3 ${isSelected ? 'bg-green-400/80' : 'bg-red-300/80'} px-4 py-1 rounded-xl text-sm font-semibold`}
          >
            {isSelected ? 'Keep' : 'Trash'}
          </div>
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
            class={`h-[32px] ${isSelected ? 'border-immich-primary rounded-xl dark:border-immich-dark-primary' : 'border-gray-300'} text-center `}
          >
            <td
              >{asset.exifInfo?.exifImageWidth}x{asset.exifInfo?.exifImageHeight} - {asByteUnitString(
                Number(asset.exifInfo?.fileSizeInByte),
                $locale,
                4,
              )}</td
            >
          </tr>
        </table>
      </div>
    {/each}
  </div>

  <!-- CONFIRM BUTTONS -->
  <div class="flex gap-4 my-4 border-transparent w-full justify-between p-4 h-[85px]">
    <div class="m-4 text-xs font-mono dark:text-white">
      <p>DUPLICATE ID {duplicate.duplicateId}</p>
      <p>TOTAL {duplicate.assets.length}</p>
    </div>

    {#if trashCount == 0}
      <Button size="sm" color="primary" class="flex place-items-center gap-2" on:click={handleOnResolve}
        ><Icon path={mdiCheck} size="20" />Keep All
      </Button>
    {:else}
      <Button size="sm" color="red" class="flex place-items-center gap-2" on:click={handleOnResolve}
        ><Icon path={mdiTrashCanOutline} size="20" />{trashCount == duplicate.assets.length
          ? 'Trash All'
          : `Trash ${trashCount}`}
      </Button>
    {/if}
  </div>
</div>
