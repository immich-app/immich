<script lang="ts">
  import Icon from '$lib/components/elements/icon.svelte';
  import { AppRoute } from '$lib/constants';
  import { getAssetThumbnailUrl } from '$lib/utils';
  import { getAltText } from '$lib/utils/thumbnail-util';
  import type { DuplicateResponseDto } from '@immich/sdk';
  import { mdiImageMultipleOutline } from '@mdi/js';

  interface Props {
    duplicate: DuplicateResponseDto;
  }

  let { duplicate }: Props = $props();

  let assetToDisplay = duplicate.assets[0];
  let title = $derived(
    JSON.stringify(
      duplicate.assets.map((asset) => asset.originalFileName),
      null,
      2,
    ),
  );
</script>

<a href="{AppRoute.DUPLICATES}/{duplicate.duplicateId}" class="block relative w-full">
  <img
    src={getAssetThumbnailUrl(assetToDisplay.id)}
    alt={$getAltText(assetToDisplay)}
    {title}
    class="h-60 object-cover rounded-xl w-full"
    draggable="false"
  />

  <div class="absolute top-2 right-3">
    <div class="bg-immich-primary/90 px-2 py-1 my-0.5 rounded-xl text-xs text-white">
      <div class="flex items-center justify-center">
        <div class="mr-1">{duplicate.assets.length}</div>
        <Icon path={mdiImageMultipleOutline} size="18" />
      </div>
    </div>
  </div>
</a>
