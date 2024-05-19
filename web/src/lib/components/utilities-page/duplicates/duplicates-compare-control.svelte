<script lang="ts">
  import Button from '$lib/components/elements/buttons/button.svelte';
  import { getAssetThumbnailUrl } from '$lib/utils';
  import { ThumbnailFormat, type DuplicateResponseDto } from '@immich/sdk';
  import Icon from '$lib/components/elements/icon.svelte';
  import { mdiCheckCircleOutline, mdiCloseCircleOutline } from '@mdi/js';

  export let duplicate: DuplicateResponseDto;
</script>

<div class="border border-gray-200 p-4 rounded-3xl bg-gray-100 mb-4 w-[900px] m-auto">
  <div class="flex gap-1 place-items-center place-content-center">
    {#each duplicate.assets as asset}
      <div>
        <img
          src={getAssetThumbnailUrl(asset.id, ThumbnailFormat.Webp)}
          alt={asset.id}
          class="w-[250px] h-[250px] object-cover rounded-t-xl"
        />
        <div class="flex justify-between rounded-b-xl">
          <button
            class="h-10 bg-red-100 hover:bg-red-300 flex place-items-center place-content-center w-full rounded-bl-xl"
            ><Icon path={mdiCloseCircleOutline} size="20" />
          </button>
          <button
            class="h-10 bg-immich-primary/10 hover:bg-immich-primary/60 flex place-items-center place-content-center w-full rounded-br-xl"
            ><Icon path={mdiCheckCircleOutline} size="20" /></button
          >
        </div>
      </div>
    {/each}
  </div>
</div>
