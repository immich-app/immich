<script lang="ts">
  import { assetViewerManager } from '#lib/managers/asset-viewer-manager.svelte.ts';
  import { authManager } from '#lib/managers/auth-manager.svelte.ts';
  import { Route } from '#lib/route.ts';
  import { locale } from '#lib/stores/preferences.store.ts';
  import { truncateMiddle } from '#lib/utils.ts';
  import { getDimensions } from '#lib/utils/asset-utils.ts';
  import { getByteUnitString } from '#lib/utils/byte-units.ts';
  import { getParentPath } from '#lib/utils/tree-utils.ts';
  import { type AssetResponseDto } from '@immich/sdk';
  import { Icon, IconButton, Text } from '@immich/ui';
  import { mdiImageOutline, mdiInformationOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import { slide } from 'svelte/transition';

  type Props = {
    asset: AssetResponseDto;
  };

  const { asset }: Props = $props();

  let isOwner = $derived(authManager.authenticated && authManager.user.id === asset.ownerId);

  const getMegapixel = (width: number, height: number): number | undefined => {
    const megapixel = Math.round((height * width) / 1_000_000);

    if (megapixel) {
      return megapixel;
    }

    return undefined;
  };

  const getAssetFolderHref = (asset: AssetResponseDto) => {
    // Remove the last part of the path to get the parent path
    return Route.folders({ path: getParentPath(asset.originalPath) });
  };
</script>

<div class="flex w-full justify-between gap-4 py-4">
  <div class="flex gap-4">
    <div class="flex-none"><Icon icon={mdiImageOutline} size="24" /></div>

    <div>
      <div class="break-all whitespace-pre-wrap">
        <Text title={asset.originalFileName}>{truncateMiddle(asset.originalFileName)}</Text>
      </div>
      {#if assetViewerManager.isShowAssetPath}
        <p class="pb-2 text-xs break-all opacity-50 hover:text-primary" transition:slide={{ duration: 250 }}>
          <!-- eslint-disable-next-line svelte/no-navigation-without-resolve this is supposed to be treated as an absolute/external link -->
          <a href={getAssetFolderHref(asset)} title={$t('go_to_folder')} class="whitespace-pre-wrap">
            {asset.originalPath}
          </a>
        </p>
      {/if}
      {#if (asset.exifInfo?.exifImageHeight && asset.exifInfo.exifImageWidth) || asset.exifInfo?.fileSizeInByte}
        <div class="flex gap-2 text-sm">
          {#if asset.exifInfo?.exifImageHeight && asset.exifInfo.exifImageWidth}
            {#if getMegapixel(asset.exifInfo.exifImageHeight, asset.exifInfo.exifImageWidth)}
              <p>
                {getMegapixel(asset.exifInfo.exifImageHeight, asset.exifInfo.exifImageWidth)} MP
              </p>
            {/if}
            {const { width, height } = $derived(getDimensions(asset.exifInfo))}
            <p>{width} × {height}</p>
          {/if}
          {#if asset.exifInfo?.fileSizeInByte}
            <p>{getByteUnitString(asset.exifInfo.fileSizeInByte, $locale)}</p>
          {/if}
        </div>
      {/if}
    </div>
  </div>
  {#if isOwner}
    <IconButton
      icon={mdiInformationOutline}
      aria-label={$t('show_file_location')}
      class="shrink-0"
      size="small"
      shape="round"
      color="secondary"
      variant="ghost"
      onclick={() => assetViewerManager.toggleAssetPath()}
    />
  {/if}
</div>
