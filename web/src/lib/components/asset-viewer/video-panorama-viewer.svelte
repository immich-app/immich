<script lang="ts">
  import { getAssetOriginalUrl, getAssetPlaybackUrl } from '$lib/utils';
  import { LoadingSpinner } from '@immich/ui';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';

  interface Props {
    assetId: string;
  }

  const { assetId }: Props = $props();

  const modules = Promise.all([
    import('./photo-sphere-viewer-adapter.svelte').then((module) => module.default),
    import('@photo-sphere-viewer/equirectangular-video-adapter').then((module) => module.EquirectangularVideoAdapter),
    import('@photo-sphere-viewer/video-plugin').then((module) => module.VideoPlugin),
    import('@photo-sphere-viewer/video-plugin/index.css'),
  ]);
</script>

<div transition:fade={{ duration: 150 }} class="flex h-full select-none place-content-center place-items-center">
  {#await modules}
    <LoadingSpinner />
  {:then [PhotoSphereViewer, adapter, videoPlugin]}
    <PhotoSphereViewer
      panorama={{ source: getAssetPlaybackUrl(assetId) }}
      originalPanorama={{ source: getAssetOriginalUrl(assetId) }}
      plugins={[videoPlugin]}
      {adapter}
      navbar
    />
  {:catch}
    {$t('errors.failed_to_load_asset')}
  {/await}
</div>
