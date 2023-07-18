<script lang="ts">
  import type { UploadAsset } from '$lib/models/upload-asset';
  import { locale } from '$lib/stores/preferences.store';
  import { asByteUnitString } from '$lib/utils/byte-units';
  import { fade } from 'svelte/transition';
  import ImmichLogo from './immich-logo.svelte';
  import { getFilenameExtension } from '../../utils/asset-utils';

  export let uploadAsset: UploadAsset;

  let showFallbackImage = false;
  const previewURL = URL.createObjectURL(uploadAsset.file);
</script>

<div
  in:fade={{ duration: 250 }}
  out:fade={{ duration: 100 }}
  class="mt-3 grid h-[70px] grid-cols-[70px_auto] gap-2 rounded-lg bg-immich-bg text-xs"
>
  <div class="relative">
    {#if showFallbackImage}
      <div in:fade={{ duration: 250 }}>
        <ImmichLogo class="h-[70px] w-[70px] rounded-bl-lg rounded-tl-lg object-cover" />
      </div>
    {:else}
      <img
        in:fade={{ duration: 250 }}
        on:load={() => {
          URL.revokeObjectURL(previewURL);
        }}
        on:error={() => {
          URL.revokeObjectURL(previewURL);
          showFallbackImage = true;
        }}
        src={previewURL}
        alt="Preview of asset"
        class="h-[70px] w-[70px] rounded-bl-lg rounded-tl-lg object-cover"
        draggable="false"
      />
    {/if}

    <div class="absolute bottom-0 left-0 h-[25px] w-full bg-immich-primary/30">
      <p
        class="absolute bottom-1 right-1 stroke-immich-primary object-right-bottom font-semibold uppercase text-gray-50/95"
      >
        .{getFilenameExtension(uploadAsset.file.name)}
      </p>
    </div>
  </div>

  <div class="flex flex-col justify-between p-2 pr-4">
    <input
      disabled
      class="w-full rounded-md border bg-gray-100 p-1 px-2 text-[10px]"
      value={`[${asByteUnitString(uploadAsset.file.size, $locale)}] ${uploadAsset.file.name}`}
    />

    <div class="relative mt-[5px] h-[15px] w-full rounded-md bg-gray-300 text-white">
      <div class="h-[15px] rounded-md bg-immich-primary transition-all" style={`width: ${uploadAsset.progress}%`} />
      <p class="absolute top-0 h-full w-full text-center text-[10px]">
        {uploadAsset.progress}/100
      </p>
    </div>
  </div>
</div>
