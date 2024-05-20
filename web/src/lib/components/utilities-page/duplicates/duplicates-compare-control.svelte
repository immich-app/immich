<script lang="ts">
  import { getAssetThumbnailUrl } from '$lib/utils';
  import { ThumbnailFormat, type AssetResponseDto, type DuplicateResponseDto } from '@immich/sdk';

  export let duplicate: DuplicateResponseDto;

  let selectedAsset = duplicate.assets.sort((a, b) => b.exifInfo!.fileSizeInByte! - a.exifInfo!.fileSizeInByte!)[0];

  const onSelectAsset = (asset: AssetResponseDto) => {
    selectedAsset = asset;
  };
</script>

<div class="pt-4 rounded-3xl bg-neutral-100 max-w-[900px] m-auto mb-8">
  <div class="flex gap-1 place-items-center place-content-center px-4">
    {#each duplicate.assets as asset, index (index)}
      {@const isCandidate = selectedAsset.id === asset.id}
      <div>
        <button on:click={() => onSelectAsset(asset)} class="block relative">
          <!-- THUMBNAIL-->
          <img
            src={getAssetThumbnailUrl(asset.id, ThumbnailFormat.Webp)}
            alt={asset.id}
            title={`assetId: ${asset.id}`}
            class={`w-[250px] h-[250px] object-cover rounded-t-xl border-t-[4px] border-l-[4px] border-r-[4px] border-gray-300 ${isCandidate ? 'border-immich-primary dark:border-immich-dark-primary' : ''}`}
            draggable="false"
          />
        </button>

        <!-- ASSET INFO-->
        <table
          class={`text-xs w-full rounded-b-xl font-semibold ${isCandidate ? 'bg-immich-primary text-white' : 'bg-gray-200'} mt-0`}
        >
          <tr class={`h-[32px] ${isCandidate ? 'border-immich-primary rounded-xl' : 'border-gray-300'} text-center `}>
            <td>{asset.exifInfo?.fileSizeInByte} bytes</td>
          </tr>
          <tr class={`h-[32px] ${isCandidate ? 'border-immich-primary rounded-xl' : 'border-gray-300'} text-center `}>
            <td>{asset.originalFileName}</td>
          </tr>
        </table>
      </div>
    {/each}
  </div>

  <!-- CONFIRM BUTTONS -->
  <div class="flex mt-6 border-transparent w-full rounded-3xl">
    <button class="h-12 bg-red-100 hover:bg-red-300 flex place-items-center place-content-center w-full rounded-bl-3xl">
      Trash all
    </button>
    <button
      class="h-12 bg-immich-primary hover:bg-immich-primary flex place-items-center place-content-center w-full rounded-br-3xl text-white"
      >Resolve</button
    >
  </div>
</div>
