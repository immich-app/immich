<script lang="ts">
  import { goto } from '$app/navigation';
  import DetailPanelDate from '$lib/components/asset-viewer/DetailPanelDate.svelte';
  import DetailPanelDescription from '$lib/components/asset-viewer/DetailPanelDescription.svelte';
  import DetailPanelLocation from '$lib/components/asset-viewer/DetailPanelLocation.svelte';
  import DetailPanelRating from '$lib/components/asset-viewer/DetailPanelStarRating.svelte';
  import DetailPanelTags from '$lib/components/asset-viewer/DetailPanelTags.svelte';
  import { timeToLoadTheMap } from '$lib/constants';
  import { assetViewerManager } from '$lib/managers/asset-viewer-manager.svelte';
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import { featureFlagsManager } from '$lib/managers/feature-flags-manager.svelte';
  import { Route } from '$lib/route';
  import { locale } from '$lib/stores/preferences.store';
  import { getAssetMediaUrl } from '$lib/utils';
  import { delay, getDimensions } from '$lib/utils/asset-utils';
  import { getByteUnitString } from '$lib/utils/byte-units';
  import { handleError } from '$lib/utils/handle-error';
  import { getParentPath } from '$lib/utils/tree-utils';
  import {
    AssetMediaSize,
    getAllAlbums,
    getAssetInfo,
    type AlbumResponseDto,
    type AssetResponseDto,
  } from '@immich/sdk';
  import { Icon, IconButton, LoadingSpinner, Text } from '@immich/ui';
  import { mdiCamera, mdiCameraIris, mdiClose, mdiImageOutline, mdiInformationOutline } from '@mdi/js';
  import { onDestroy } from 'svelte';
  import { t } from 'svelte-i18n';
  import { slide } from 'svelte/transition';
  import PersonSidePanel from '../faces-page/PersonSidePanel.svelte';
  import OnEvents from '../OnEvents.svelte';
  import UserAvatar from '../shared-components/UserAvatar.svelte';
  import AlbumListItemDetails from './AlbumListItemDetails.svelte';
  import DetailPanelPeople from '$lib/components/asset-viewer/DetailPanelPeople.svelte';

  interface Props {
    asset: AssetResponseDto;
    currentAlbum?: AlbumResponseDto | null;
  }

  let { asset, currentAlbum = null }: Props = $props();

  let isOwner = $derived(authManager.authenticated && authManager.user.id === asset.ownerId);
  let latlng = $derived(
    (() => {
      const lat = asset.exifInfo?.latitude;
      const lng = asset.exifInfo?.longitude;

      if (lat && lng) {
        return { lat: Number(lat.toFixed(7)), lng: Number(lng.toFixed(7)) };
      }
    })(),
  );
  let previousId: string | undefined = $state();
  let previousRoute = $derived(currentAlbum?.id ? Route.viewAlbum(currentAlbum) : Route.photos());

  const refreshAlbums = async () => {
    if (authManager.isSharedLink) {
      return [];
    }

    try {
      return await getAllAlbums({ assetId: asset.id });
    } catch (error) {
      handleError(error, 'Error getting asset album membership');
      return [];
    }
  };

  let albums = $derived(refreshAlbums());

  $effect(() => {
    if (!previousId) {
      previousId = asset.id;
      return;
    }

    if (asset.id === previousId) {
      return;
    }

    assetViewerManager.closeEditFacesPanel();
    previousId = asset.id;
  });

  const getMegapixel = (width: number, height: number): number | undefined => {
    const megapixel = Math.round((height * width) / 1_000_000);

    if (megapixel) {
      return megapixel;
    }

    return undefined;
  };

  const handleRefreshPeople = async () => {
    asset = await getAssetInfo({ id: asset.id });
    assetViewerManager.closeEditFacesPanel();
  };

  const getAssetFolderHref = (asset: AssetResponseDto) => {
    // Remove the last part of the path to get the parent path
    return Route.folders({ path: getParentPath(asset.originalPath) });
  };

  onDestroy(() => {
    assetViewerManager.closeEditFacesPanel();
  });
</script>

<OnEvents onAlbumAddAssets={() => (albums = refreshAlbums())} />

{#if !assetViewerManager.isEditFacesPanelOpen}
  <section class="relative p-2">
    <div class="flex place-items-center gap-2">
      <IconButton
        icon={mdiClose}
        aria-label={$t('close')}
        onclick={() => assetViewerManager.closeDetailPanel()}
        shape="round"
        color="secondary"
        variant="ghost"
      />
      <p class="text-lg text-immich-fg dark:text-immich-dark-fg">{$t('info')}</p>
    </div>

    {#if asset.isOffline}
      <section class="p-4">
        <div role="alert">
          <div class="rounded-t bg-red-500 px-4 py-2 font-bold text-white">
            {$t('asset_offline')}
          </div>
          <div class="border border-t-0 border-red-400 bg-red-100 px-4 py-3 text-red-700">
            <p>
              {#if authManager.authenticated && authManager.user.isAdmin}
                {$t('admin.asset_offline_description')}
              {:else}
                {$t('asset_offline_description')}
              {/if}
            </p>
          </div>
          <div class="rounded-b bg-red-500 px-4 py-2 text-sm text-white">
            <p>{asset.originalPath}</p>
          </div>
        </div>
      </section>
    {/if}

    <DetailPanelDescription {asset} {isOwner} />
    <DetailPanelRating {asset} {isOwner} />
    <DetailPanelPeople {asset} {isOwner} {previousRoute} />

    <div class="p-4">
      {#if asset.exifInfo}
        <div class="flex h-10 w-full items-center justify-between text-sm">
          <Text size="small" color="muted">{$t('details')}</Text>
        </div>
      {:else}
        <Text size="small" color="muted">{$t('no_exif_info_available')}</Text>
      {/if}

      <DetailPanelDate {asset} />

      <div class="flex gap-4 py-4">
        <div><Icon icon={mdiImageOutline} size="24" /></div>

        <div>
          <p class="flex place-items-center gap-2 break-all whitespace-pre-wrap">
            {asset.originalFileName}
            {#if isOwner}
              <IconButton
                icon={mdiInformationOutline}
                aria-label={$t('show_file_location')}
                size="small"
                shape="round"
                color="secondary"
                variant="ghost"
                onclick={() => assetViewerManager.toggleAssetPath()}
              />
            {/if}
          </p>
          {#if assetViewerManager.isShowAssetPath}
            <p class="pb-2 text-xs break-all opacity-50 hover:text-primary" transition:slide={{ duration: 250 }}>
              <!-- eslint-disable-next-line svelte/no-navigation-without-resolve this is supposed to be treated as an absolute/external link -->
              <a href={getAssetFolderHref(asset)} title={$t('go_to_folder')} class="whitespace-pre-wrap">
                {asset.originalPath}
              </a>
            </p>
          {/if}
          {#if (asset.exifInfo?.exifImageHeight && asset.exifInfo?.exifImageWidth) || asset.exifInfo?.fileSizeInByte}
            <div class="flex gap-2 text-sm">
              {#if asset.exifInfo?.exifImageHeight && asset.exifInfo?.exifImageWidth}
                {#if getMegapixel(asset.exifInfo.exifImageHeight, asset.exifInfo.exifImageWidth)}
                  <p>
                    {getMegapixel(asset.exifInfo.exifImageHeight, asset.exifInfo.exifImageWidth)} MP
                  </p>
                {/if}
                {@const { width, height } = getDimensions(asset.exifInfo)}
                <p>{width} x {height}</p>
              {/if}
              {#if asset.exifInfo?.fileSizeInByte}
                <p>{getByteUnitString(asset.exifInfo.fileSizeInByte, $locale)}</p>
              {/if}
            </div>
          {/if}
        </div>
      </div>

      {#if asset.exifInfo?.make || asset.exifInfo?.model || asset.exifInfo?.exposureTime || asset.exifInfo?.iso}
        <div class="flex gap-4 py-4">
          <div><Icon icon={mdiCamera} size="24" /></div>

          <div>
            {#if asset.exifInfo?.make || asset.exifInfo?.model}
              <p>
                <a
                  href={Route.search({
                    make: asset.exifInfo?.make ?? undefined,
                    model: asset.exifInfo?.model ?? undefined,
                  })}
                  title="{$t('search_for')} {asset.exifInfo.make || ''} {asset.exifInfo.model || ''}"
                  class="hover:text-primary"
                >
                  {asset.exifInfo.make || ''}
                  {asset.exifInfo.model || ''}
                </a>
              </p>
            {/if}

            <div class="flex gap-2 text-sm">
              {#if asset.exifInfo.exposureTime}
                <p>{`${asset.exifInfo.exposureTime} s`}</p>
              {/if}

              {#if asset.exifInfo.iso}
                <p>{`ISO ${asset.exifInfo.iso}`}</p>
              {/if}
            </div>
          </div>
        </div>
      {/if}

      {#if asset.exifInfo?.lensModel || asset.exifInfo?.fNumber || asset.exifInfo?.focalLength}
        <div class="flex gap-4 py-4">
          <div><Icon icon={mdiCameraIris} size="24" /></div>

          <div>
            {#if asset.exifInfo?.lensModel}
              <p>
                <a
                  href={Route.search({ lensModel: asset.exifInfo.lensModel })}
                  title="{$t('search_for')} {asset.exifInfo.lensModel}"
                  class="line-clamp-1 hover:text-primary"
                >
                  {asset.exifInfo.lensModel}
                </a>
              </p>
            {/if}

            <div class="flex gap-2 text-sm">
              {#if asset.exifInfo?.fNumber}
                <p>ƒ/{asset.exifInfo.fNumber.toLocaleString($locale)}</p>
              {/if}

              {#if asset.exifInfo.focalLength}
                <p>{`${asset.exifInfo.focalLength.toLocaleString($locale)} mm`}</p>
              {/if}
            </div>
          </div>
        </div>
      {/if}

      <DetailPanelLocation {isOwner} {asset} />
    </div>
  </section>

  {#if latlng && featureFlagsManager.value.map}
    <div class="h-90">
      {#await import('$lib/components/shared-components/map/Map.svelte')}
        {#await delay(timeToLoadTheMap) then}
          <!-- show the loading spinner only if loading the map takes too much time -->
          <div class="flex size-full items-center justify-center">
            <LoadingSpinner />
          </div>
        {/await}
      {:then { default: Map }}
        <Map
          mapMarkers={[
            {
              lat: latlng.lat,
              lon: latlng.lng,
              id: asset.id,
              city: asset.exifInfo?.city ?? null,
              state: asset.exifInfo?.state ?? null,
              country: asset.exifInfo?.country ?? null,
            },
          ]}
          center={latlng}
          showSettings={false}
          zoom={12.5}
          simplified
          useLocationPin
          showSimpleControls={!assetViewerManager.isEditFacesPanelOpen}
          onOpenInMapView={() => goto(Route.map({ ...latlng, zoom: 12.5 }))}
        >
          {#snippet popup({ marker })}
            {@const { lat, lon } = marker}
            <div class="flex flex-col items-center gap-1">
              <p class="font-bold">{lat.toPrecision(6)}, {lon.toPrecision(6)}</p>
              <a
                href="https://www.openstreetmap.org/?mlat={lat}&mlon={lon}&zoom=13#map=15/{lat}/{lon}"
                target="_blank"
                class="font-medium text-primary underline focus:outline-none"
              >
                {$t('open_in_openstreetmap')}
              </a>
            </div>
          {/snippet}
        </Map>
      {/await}
    </div>
  {/if}

  {#if currentAlbum && currentAlbum.albumUsers.length > 0 && asset.owner}
    <section class="mt-4 px-6 dark:text-immich-dark-fg">
      <Text size="small" color="muted">{$t('shared_by')}</Text>
      <div class="flex gap-4 pt-4">
        <div>
          <UserAvatar user={asset.owner} size="md" />
        </div>

        <div class="my-auto">
          <p>
            {asset.owner.name}
          </p>
        </div>
      </div>
    </section>
  {/if}

  {#await albums then albums}
    {#if albums.length > 0}
      <section class="p-6 dark:text-immich-dark-fg">
        <div class="pb-4">
          <Text size="small" color="muted">{$t('appears_in')}</Text>
        </div>
        {#each albums as album (album.id)}
          <a href={Route.viewAlbum(album)}>
            <div class="flex items-center gap-4 pt-2 hover:cursor-pointer">
              <div>
                <img
                  alt={album.albumName}
                  class="size-12.5 rounded-sm object-cover"
                  src={album.albumThumbnailAssetId &&
                    getAssetMediaUrl({ id: album.albumThumbnailAssetId, size: AssetMediaSize.Preview })}
                  draggable="false"
                />
              </div>

              <div class="my-auto">
                <p class="dark:text-immich-dark-primary">{album.albumName}</p>
                <div class="flex flex-col gap-0 text-sm">
                  <div>
                    <AlbumListItemDetails {album} />
                  </div>
                </div>
              </div>
            </div>
          </a>
        {/each}
      </section>
    {/if}
  {/await}

  {#if authManager.authenticated && authManager.preferences.tags.enabled}
    <section class="relative px-2 pb-12 dark:bg-immich-dark-bg dark:text-immich-dark-fg">
      <DetailPanelTags {asset} {isOwner} />
    </section>
  {/if}
{/if}

{#if assetViewerManager.isEditFacesPanelOpen}
  <PersonSidePanel
    assetId={asset.id}
    assetType={asset.type}
    onClose={() => assetViewerManager.closeEditFacesPanel()}
    onRefresh={handleRefreshPeople}
  />
{/if}
