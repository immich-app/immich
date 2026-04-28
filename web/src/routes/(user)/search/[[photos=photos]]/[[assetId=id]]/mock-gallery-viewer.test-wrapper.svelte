<script lang="ts">
  import type { AssetResponseDto } from '@immich/sdk';

  interface Props {
    assets?: AssetResponseDto[];
  }

  let { assets = [] }: Props = $props();
</script>

<div data-testid="gallery-viewer">
  {#each assets as asset (asset.id)}
    <div data-testid={`asset-row-${asset.id}`}>{asset.id}</div>
  {/each}
</div>
