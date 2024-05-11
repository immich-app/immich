<script lang="ts">
  import { serveFile, type AssetResponseDto, AssetTypeEnum } from '@immich/sdk';
  import { fade } from 'svelte/transition';
  import LoadingSpinner from '../shared-components/loading-spinner.svelte';
  import { getAssetFileUrl, getKey } from '$lib/utils';
  import type { AdapterConstructor, PluginConstructor } from '@photo-sphere-viewer/core';
  export let asset: Pick<AssetResponseDto, 'id' | 'type'>;

  const photoSphereConfigs =
    asset.type === AssetTypeEnum.Video
      ? ([
          import('@photo-sphere-viewer/equirectangular-video-adapter').then(
            ({ EquirectangularVideoAdapter }) => EquirectangularVideoAdapter,
          ),
          import('@photo-sphere-viewer/video-plugin').then(({ VideoPlugin }) => [VideoPlugin]),
          true,
          import('@photo-sphere-viewer/video-plugin/index.css'),
        ] as [PromiseLike<AdapterConstructor>, Promise<PluginConstructor[]>, true, unknown])
      : ([undefined, [], false] as [undefined, [], false]);

  const loadAssetData = async () => {
    if (asset.type === AssetTypeEnum.Video) {
      return { source: getAssetFileUrl(asset.id, false, false) };
    }
    const data = await serveFile({ id: asset.id, isWeb: false, isThumb: false, key: getKey() });
    const url = URL.createObjectURL(data);
    return url;
  };
</script>

<div transition:fade={{ duration: 150 }} class="flex h-full select-none place-content-center place-items-center">
  <!-- the photo sphere viewer is quite large, so lazy load it in parallel with loading the data -->
  {#await Promise.all([loadAssetData(), import('./photo-sphere-viewer-adapter.svelte'), ...photoSphereConfigs])}
    <LoadingSpinner />
  {:then [data, module, adapter, plugins, navbar]}
    <svelte:component this={module.default} panorama={data} plugins={plugins ?? undefined} {navbar} {adapter} />
  {:catch}
    Failed to load asset
  {/await}
</div>
