<script lang="ts">
  import { alwaysLoadOriginalFile } from '$lib/stores/preferences.store';
  import { getAssetOriginalUrl, getKey } from '$lib/utils';
  import { isWebCompatibleImage } from '$lib/utils/asset-utils';
  import { AssetMediaSize, AssetTypeEnum, viewAsset, type AssetResponseDto } from '@immich/sdk';
  import type { AdapterConstructor, PluginConstructor } from '@photo-sphere-viewer/core';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';
  import LoadingSpinner from '../shared-components/loading-spinner.svelte';

  export let asset: { id: string; type: AssetTypeEnum.Video } | AssetResponseDto;

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

  const originalImageUrl =
    asset.type === AssetTypeEnum.Image && isWebCompatibleImage(asset) ? getAssetOriginalUrl(asset.id) : null;

  const loadAssetData = async () => {
    if (asset.type === AssetTypeEnum.Video) {
      return { source: getAssetOriginalUrl(asset.id) };
    }
    if (originalImageUrl && $alwaysLoadOriginalFile) {
      return getAssetOriginalUrl(asset.id);
    }
    const data = await viewAsset({ id: asset.id, size: AssetMediaSize.Preview, key: getKey() });
    const url = URL.createObjectURL(data);
    return url;
  };
</script>

<div transition:fade={{ duration: 150 }} class="flex h-full select-none place-content-center place-items-center">
  <!-- the photo sphere viewer is quite large, so lazy load it in parallel with loading the data -->
  {#await Promise.all([loadAssetData(), import('./photo-sphere-viewer-adapter.svelte'), ...photoSphereConfigs])}
    <LoadingSpinner />
  {:then [data, module, adapter, plugins, navbar]}
    <svelte:component
      this={module.default}
      panorama={data}
      plugins={plugins ?? undefined}
      {navbar}
      {adapter}
      {originalImageUrl}
    />
  {:catch}
    {$t('errors.failed_to_load_asset')}
  {/await}
</div>
