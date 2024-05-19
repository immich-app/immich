<script lang="ts">
  import { getAssetThumbnailUrl } from '$lib/utils';
  import { ThumbnailFormat, type DuplicateResponseDto } from '@immich/sdk';
  import Icon from '$lib/components/elements/icon.svelte';
  import { mdiCheckCircleOutline, mdiCloseCircleOutline } from '@mdi/js';

  export let duplicate: DuplicateResponseDto;
</script>

<div class="border border-gray-200 pt-4 rounded-3xl bg-neutral-100 max-w-[900px] m-auto mb-4">
  <div class="flex gap-1 place-items-center place-content-center px-4">
    {#each duplicate.assets as asset, index (index)}
      <div class="">
        <!-- THUMBNAIL-->
        <img
          src={getAssetThumbnailUrl(asset.id, ThumbnailFormat.Webp)}
          alt={asset.id}
          title={`assetId: ${asset.id}`}
          class="w-[250px] h-[250px] object-cover rounded-t-xl"
        />
        <!-- ASSET INFO-->

        <table class="text-xs w-full bg-gray-200">
          <tr class="h-[30px]">
            <td class="border border-gray-300 text-center">{asset.exifInfo?.fileSizeInByte} bytes</td>
          </tr>
          <tr class="h-[30px]">
            <td class="border border-gray-300 text-center">{asset.originalFileName}</td>
          </tr>
        </table>

        <!-- ACTION BUTTONS-->
        <div class="flex justify-between rounded-b-xl">
          <button
            class="border border-gray-300 h-10 bg-red-100 hover:bg-red-300 flex place-items-center place-content-center w-full rounded-bl-xl"
            ><Icon path={mdiCloseCircleOutline} size="20" />
          </button>
          <button
            class="border border-gray-300 h-10 bg-immich-primary/10 hover:bg-immich-primary/60 flex place-items-center place-content-center w-full rounded-br-xl"
            ><Icon path={mdiCheckCircleOutline} size="20" /></button
          >
        </div>
      </div>
    {/each}
  </div>

  <!-- CONFIRM BUTTONS -->
  <div class="flex mt-6 border-transparent w-full">
    <button
      class="h-14 bg-gray-200 hover:bg-gray-300 flex place-items-center place-content-center w-full rounded-bl-3xl"
    >
      Ignore
    </button>
    <button
      class="h-14 bg-immich-primary/90 hover:bg-immich-primary flex place-items-center place-content-center w-full rounded-br-3xl text-white"
      >Resolve</button
    >
  </div>
</div>
