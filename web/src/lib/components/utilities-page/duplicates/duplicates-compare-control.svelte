<script lang="ts">
  import Button from '$lib/components/elements/buttons/button.svelte';
  import { getAssetThumbnailUrl } from '$lib/utils';
  import { ThumbnailFormat, type DuplicateResponseDto } from '@immich/sdk';

  export let duplicate: DuplicateResponseDto;
</script>

<div class="border border-gray-200 p-4 rounded-3xl bg-gray-100">
  <div class="flex gap-2">
    {#each duplicate.assets as asset}
      <div>
        <img src={getAssetThumbnailUrl(asset.id, ThumbnailFormat.Webp)} alt={asset.id} width="200" />
        <div>
          <button>Remove</button>
          <button>Accept</button>
        </div>
      </div>
    {/each}
  </div>
</div>
