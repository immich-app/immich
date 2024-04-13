<script lang="ts">
  import { serveFile, type AssetResponseDto, AssetTypeEnum } from '@immich/sdk';
  import { fade } from 'svelte/transition';
  import LoadingSpinner from '../shared-components/loading-spinner.svelte';
  import { getKey } from '$lib/utils';
  export let asset: Pick<AssetResponseDto, 'id' | 'type'>;

  const photoSphereConfigs =
    asset.type === AssetTypeEnum.Video
      ? [
          import('@photo-sphere-viewer/equirectangular-video-adapter').then(
            ({ EquirectangularVideoAdapter }) => EquirectangularVideoAdapter,
          ),
          import('@photo-sphere-viewer/video-plugin').then(({ VideoPlugin }) => [VideoPlugin]),
          true,
          import('@photo-sphere-viewer/video-plugin/index.css'),
        ]
      : [null, [], false];

  const loadAssetData = async () => {
    const data = await serveFile({ id: asset.id, isWeb: false, isThumb: false, key: getKey() });
    const url = URL.createObjectURL(data);
    if (asset.type === AssetTypeEnum.Video) {
      return { source: url };
    }
    return url;
  };
</script>

<div transition:fade={{ duration: 150 }} class="flex h-full select-none place-content-center place-items-center">
  <!-- the photo sphere viewer is quite large, so lazy load it in parallel with loading the data -->
  {#await Promise.all([loadAssetData(), import('./photo-sphere-viewer-adapter.svelte'), ...photoSphereConfigs])}
    <LoadingSpinner />
  {:then [data, module, adapter, plugins, navbar]}
    <svelte:component this={module.default} panorama={data} {plugins} {navbar} {adapter} />
  {:catch}
    Failed to load asset
  {/await}
</div>
