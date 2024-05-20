<script lang="ts">
  import Button from '$lib/components/elements/buttons/button.svelte';
  import Icon from '$lib/components/elements/icon.svelte';
  import { locale } from '$lib/stores/preferences.store';
  import { getAssetThumbnailUrl } from '$lib/utils';
  import { asByteUnitString } from '$lib/utils/byte-units';
  import { ThumbnailFormat, type AssetResponseDto, type DuplicateResponseDto } from '@immich/sdk';
  import { mdiDelete, mdiImageCheckOutline, mdiImagePlusOutline } from '@mdi/js';

  export let duplicate: DuplicateResponseDto;

  let selectedAsset = duplicate.assets.sort((a, b) => b.exifInfo!.fileSizeInByte! - a.exifInfo!.fileSizeInByte!)[0];

  const onSelectAsset = (asset: AssetResponseDto) => {
    selectedAsset = asset;
  };
</script>

<div class="pt-4 rounded-3xl border border-gray-300 dark:border-gray-700 max-w-[900px] m-auto mb-12">
  <div class="flex gap-1 place-items-center place-content-center px-4">
    {#each duplicate.assets as asset, index (index)}
      {@const isCandidate = selectedAsset.id === asset.id}
      <div class="relative">
        <button on:click={() => onSelectAsset(asset)} class="block relative">
          <!-- THUMBNAIL-->
          <img
            src={getAssetThumbnailUrl(asset.id, ThumbnailFormat.Webp)}
            alt={asset.id}
            title={`assetId: ${asset.id}`}
            class={`w-[250px] h-[250px] object-cover rounded-t-xl border-t-[4px] border-l-[4px] border-r-[4px] border-gray-300 ${isCandidate ? 'border-immich-primary dark:border-immich-dark-primary' : 'dark:border-gray-800'}`}
            draggable="false"
          />

          <!-- OVERLAY CHIP -->
          <div
            class={`absolute bottom-2 right-3 ${isCandidate ? 'bg-green-400/80' : 'bg-red-300/80'} px-4 py-1 rounded-xl text-sm font-semibold`}
          >
            {isCandidate ? 'Keep' : 'Trash'}
          </div>
        </button>

        <!-- ASSET INFO-->
        <table
          class={`text-xs w-full rounded-b-xl font-semibold ${isCandidate ? 'bg-immich-primary text-white dark:bg-immich-dark-primary dark:text-black' : 'bg-gray-200 dark:bg-gray-800 dark:text-white'} mt-0`}
        >
          <tr
            class={`h-[32px] ${isCandidate ? 'border-immich-primary rounded-xl dark:border-immich-dark-primary' : 'border-gray-300'} text-center `}
          >
            <td>{asset.originalFileName}</td>
          </tr>
          <tr
            class={`h-[32px] ${isCandidate ? 'border-immich-primary rounded-xl dark:border-immich-dark-primary' : 'border-gray-300'} text-center `}
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
  <div class="flex gap-4 mt-6 border-transparent w-full place-content-end p-4">
    <Button size="sm" color="light-red" class="flex place-items-center gap-2"><Icon path={mdiDelete} />Trash all</Button
    >
    <Button size="sm" color="green" class="flex place-items-center gap-2"
      ><Icon path={mdiImagePlusOutline} />Keep all</Button
    >
    <Button size="sm" class="flex place-items-center gap-2"><Icon path={mdiImageCheckOutline} />Resolve</Button>
  </div>
</div>
