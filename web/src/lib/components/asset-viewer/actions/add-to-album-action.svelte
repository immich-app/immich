<script lang="ts">
  import AddToMenuContent from '$lib/components/add-to/AddToMenuContent.svelte';
  import type { OnAction } from '$lib/components/asset-viewer/actions/action';
  import { AssetAction } from '$lib/constants';
  import { toTimelineAsset } from '$lib/utils/timeline-util';
  import type { AlbumResponseDto, AssetResponseDto } from '@immich/sdk';

  interface Props {
    asset: AssetResponseDto;
    onAction: OnAction;
  }

  let { asset, onAction }: Props = $props();
  let selection = $state([toTimelineAsset(asset)]);

  $effect(() => {
    selection = [toTimelineAsset(asset)];
  });

  const handleAlbumAdded = ({ album }: { assetIds: string[]; album: AlbumResponseDto }) => {
    onAction({ type: AssetAction.ADD_TO_ALBUM, asset: toTimelineAsset(asset), album });
  };
</script>

<AddToMenuContent assets={selection} onAlbumAddedDetail={handleAlbumAdded} />
