<script lang="ts">
  import AddToMenuContent from '$lib/components/add-to/AddToMenuContent.svelte';
  import { getAssetControlContext } from '$lib/components/timeline/AssetSelectControlBar.svelte';
  import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
  import type { OnAddToAlbum } from '$lib/utils/actions';
  import { onMount } from 'svelte';

  interface Props {
    shared?: boolean;
    onAddToAlbum?: OnAddToAlbum;
  }

  let { shared: _legacyShared = false, onAddToAlbum = () => {} }: Props = $props();
  void _legacyShared;

  const { getAssets } = getAssetControlContext();
  let selection: TimelineAsset[] = $state([]);

  const snapshotSelection = () => {
    selection = [...getAssets()];
  };

  onMount(snapshotSelection);
</script>

<AddToMenuContent assets={selection} onAssetsAdded={onAddToAlbum} />
