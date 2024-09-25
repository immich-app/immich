<script lang="ts">
  import { goto } from '$app/navigation';
  import DetailPanelDescription from '$lib/components/asset-viewer/detail-panel-description.svelte';
  import DetailPanelLocation from '$lib/components/asset-viewer/detail-panel-location.svelte';
  import DetailPanelRating from '$lib/components/asset-viewer/detail-panel-star-rating.svelte';
  import DetailPanelTags from '$lib/components/asset-viewer/detail-panel-tags.svelte';
  import Icon from '$lib/components/elements/icon.svelte';
  import ChangeDate from '$lib/components/shared-components/change-date.svelte';
  import { AppRoute, QueryParameter, timeToLoadTheMap } from '$lib/constants';
  import { boundingBoxesArray } from '$lib/stores/people.store';
  import { locale } from '$lib/stores/preferences.store';
  import { featureFlags } from '$lib/stores/server-config.store';
  import { preferences, user } from '$lib/stores/user.store';
  import { getAssetThumbnailUrl, getPeopleThumbnailUrl, handlePromiseError, isSharedLink } from '$lib/utils';
  import { delay, isFlipped } from '$lib/utils/asset-utils';
  import { getByteUnitString } from '$lib/utils/byte-units';
  import { handleError } from '$lib/utils/handle-error';
  import { fromDateTimeOriginal, fromLocalDateTime } from '$lib/utils/timeline-util';
  import {
    AssetMediaSize,
    getAssetInfo,
    updateAsset,
    type AlbumResponseDto,
    type AssetResponseDto,
    type ExifResponseDto,
  } from '@immich/sdk';
  import {
    mdiAccountOff,
    mdiCalendar,
    mdiCameraIris,
    mdiClose,
    mdiEye,
    mdiEyeOff,
    mdiImageOutline,
    mdiInformationOutline,
    mdiPencil,
  } from '@mdi/js';
  import { DateTime } from 'luxon';
  import { t } from 'svelte-i18n';
  import { slide } from 'svelte/transition';
  import ImageThumbnail from '../assets/thumbnail/image-thumbnail.svelte';
  import CircleIconButton from '../elements/buttons/circle-icon-button.svelte';
  import PersonSidePanel from '../faces-page/person-side-panel.svelte';
  import LoadingSpinner from '../shared-components/loading-spinner.svelte';
  import UserAvatar from '../shared-components/user-avatar.svelte';
  import AlbumListItemDetails from './album-list-item-details.svelte';
  import Portal from '$lib/components/shared-components/portal/portal.svelte';

  export let asset: AssetResponseDto;
  export let albums: AlbumResponseDto[] = [];
  export let currentAlbum: AlbumResponseDto | null = null;
  export let onClose: () => void;

  const getDimensions = (exifInfo: ExifResponseDto) => {
    const { exifImageWidth: width, exifImageHeight: height } = exifInfo;
    if (isFlipped(exifInfo.orientation)) {
      return { width: height, height: width };
    }

    return { width, height };
  };

  let showAssetPath = false;
  let showEditFaces = false;
  let previousId: string;

  $: {
    if (!previousId) {
      previousId = asset.id;
    }
    if (asset.id !== previousId) {
      showEditFaces = false;
      previousId = asset.id;
    }
  }

  $: isOwner = $user?.id === asset.ownerId;

  const handleNewAsset = async (newAsset: AssetResponseDto) => {
    // TODO: check if reloading asset data is necessary
    if (newAsset.id && !isSharedLink()) {
      const data = await getAssetInfo({ id: asset.id });
      people = data?.people || [];
      unassignedFaces = data?.unassignedFaces || [];
    }
  };

  $: handlePromiseError(handleNewAsset(asset));

  $: latlng = (() => {
    const lat = asset.exifInfo?.latitude;
    const lng = asset.exifInfo?.longitude;

    if (lat && lng) {
      return { lat: Number(lat.toFixed(7)), lng: Number(lng.toFixed(7)) };
    }
  })();

  $: people = asset.people || [];
  $: showingHiddenPeople = false;

  $: unassignedFaces = asset.unassignedFaces || [];

  $: timeZone = asset.exifInfo?.timeZone;
  $: dateTime =
    timeZone && asset.exifInfo?.dateTimeOriginal
      ? fromDateTimeOriginal(asset.exifInfo.dateTimeOriginal, timeZone)
      : fromLocalDateTime(asset.localDateTime);

  const getMegapixel = (width: number, height: number): number | undefined => {
    const megapixel = Math.round((height * width) / 1_000_000);

    if (megapixel) {
      return megapixel;
    }

    return undefined;
  };

  const handleRefreshPeople = async () => {
    await getAssetInfo({ id: asset.id }).then((data) => {
      people = data?.people || [];
      unassignedFaces = data?.unassignedFaces || [];
    });
    showEditFaces = false;
  };

  const toggleAssetPath = () => (showAssetPath = !showAssetPath);

  let isShowChangeDate = false;

  async function handleConfirmChangeDate(dateTimeOriginal: string) {
    isShowChangeDate = false;
    try {
      await updateAsset({ id: asset.id, updateAssetDto: { dateTimeOriginal } });
    } catch (error) {
      handleError(error, $t('errors.unable_to_change_date'));
    }
  }
</script>

<section class="relative p-2 dark:bg-immich-dark-bg dark:text-immich-dark-fg">
  <div class="flex place-items-center gap-2">
    <CircleIconButton icon={mdiClose} title={$t('close')} on:click={onClose} />
    <p class="text-lg text-immich-fg dark:text-immich-dark-fg">{$t('info')}</p>
  </div>

  {#if asset.isOffline}
    <section class="px-4 py-4">
      <div role="alert">
        <div class="rounded-t bg-red-500 px-4 py-2 font-bold text-white">
          {$t('asset_offline')}
        </div>
        <div class="border border-t-0 border-red-400 bg-red-100 px-4 py-3 text-red-700">
          <p>
            {#if $user?.isAdmin}
              <p>{$t('admin.asset_offline_description')}</p>
            {:else}
              {$t('asset_offline_description')}
            {/if}
          </p>
        </div>
        <div class="rounded-b bg-red-500 px-4 py-2 text-white text-sm">
          <p>{asset.originalPath}</p>
        </div>
      </div>
    </section>
  {/if}

  <DetailPanelDescription {asset} {isOwner} />
  <DetailPanelRating {asset} {isOwner} />

  {#if (!isSharedLink() && unassignedFaces.length > 0) || people.length > 0}
    <section class="px-4 pt-4 text-sm">
      <div class="flex h-10 w-full items-center justify-between">
        <h2>{$t('people').toUpperCase()}</h2>
        <div class="flex gap-2 items-center">
          {#if unassignedFaces.length > 0}
            <Icon
              ariaLabel={$t('asset_has_unassigned_faces')}
              title={$t('asset_has_unassigned_faces')}
              color="currentColor"
              path={mdiAccountOff}
              size="24"
            />
          {/if}
          {#if people.some((person) => person.isHidden)}
            <CircleIconButton
              title={$t('show_hidden_people')}
              icon={showingHiddenPeople ? mdiEyeOff : mdiEye}
              padding="1"
              buttonSize="32"
              on:click={() => (showingHiddenPeople = !showingHiddenPeople)}
            />
          {/if}
          <CircleIconButton
            title={$t('edit_people')}
            icon={mdiPencil}
            padding="1"
            size="20"
            buttonSize="32"
            on:click={() => (showEditFaces = true)}
          />
        </div>
      </div>

      <div class="mt-2 flex flex-wrap gap-2">
        {#each people as person, index (person.id)}
          {#if showingHiddenPeople || !person.isHidden}
            <a
              class="w-[90px]"
              href="{AppRoute.PEOPLE}/{person.id}?{QueryParameter.PREVIOUS_ROUTE}={currentAlbum?.id
                ? `${AppRoute.ALBUMS}/${currentAlbum?.id}`
                : AppRoute.PHOTOS}"
              on:focus={() => ($boundingBoxesArray = people[index].faces)}
              on:blur={() => ($boundingBoxesArray = [])}
              on:mouseover={() => ($boundingBoxesArray = people[index].faces)}
              on:mouseleave={() => ($boundingBoxesArray = [])}
            >
              <div class="relative">
                <ImageThumbnail
                  curve
                  shadow
                  url={getPeopleThumbnailUrl(person)}
                  altText={person.name}
                  title={person.name}
                  widthStyle="90px"
                  heightStyle="90px"
                  hidden={person.isHidden}
                />
              </div>
              <p class="mt-1 truncate font-medium" title={person.name}>{person.name}</p>
              {#if person.birthDate}
                {@const personBirthDate = DateTime.fromISO(person.birthDate)}
                {@const age = Math.floor(DateTime.fromISO(asset.localDateTime).diff(personBirthDate, 'years').years)}
                {@const ageInMonths = Math.floor(
                  DateTime.fromISO(asset.localDateTime).diff(personBirthDate, 'months').months,
                )}
                {#if age >= 0}
                  <p
                    class="font-light"
                    title={personBirthDate.toLocaleString(
                      {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      },
                      { locale: $locale },
                    )}
                  >
                    {#if ageInMonths <= 11}
                      {$t('age_months', { values: { months: ageInMonths } })}
                    {:else if ageInMonths > 12 && ageInMonths <= 23}
                      {$t('age_year_months', { values: { months: ageInMonths - 12 } })}
                    {:else}
                      {$t('age_years', { values: { years: age } })}
                    {/if}
                  </p>
                {/if}
              {/if}
            </a>
          {/if}
        {/each}
      </div>
    </section>
  {/if}

  <div class="px-4 py-4">
    {#if asset.exifInfo}
      <div class="flex h-10 w-full items-center justify-between text-sm">
        <h2>{$t('details').toUpperCase()}</h2>
      </div>
    {:else}
      <p class="text-sm">{$t('no_exif_info_available').toUpperCase()}</p>
    {/if}

    {#if dateTime}
      <button
        type="button"
        class="flex w-full text-left justify-between place-items-start gap-4 py-4"
        on:click={() => (isOwner ? (isShowChangeDate = true) : null)}
        title={isOwner ? $t('edit_date') : ''}
        class:hover:dark:text-immich-dark-primary={isOwner}
        class:hover:text-immich-primary={isOwner}
      >
        <div class="flex gap-4">
          <div>
            <Icon path={mdiCalendar} size="24" />
          </div>

          <div>
            <p>
              {dateTime.toLocaleString(
                {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                },
                { locale: $locale },
              )}
            </p>
            <div class="flex gap-2 text-sm">
              <p>
                {dateTime.toLocaleString(
                  {
                    weekday: 'short',
                    hour: 'numeric',
                    minute: '2-digit',
                    timeZoneName: timeZone ? 'longOffset' : undefined,
                  },
                  { locale: $locale },
                )}
              </p>
            </div>
          </div>
        </div>

        {#if isOwner}
          <div class="p-1">
            <Icon path={mdiPencil} size="20" />
          </div>
        {/if}
      </button>
    {:else if !dateTime && isOwner}
      <div class="flex justify-between place-items-start gap-4 py-4">
        <div class="flex gap-4">
          <div>
            <Icon path={mdiCalendar} size="24" />
          </div>
        </div>
        <div class="p-1">
          <Icon path={mdiPencil} size="20" />
        </div>
      </div>
    {/if}

    {#if isShowChangeDate}
      <Portal>
        <ChangeDate
          initialDate={dateTime}
          initialTimeZone={timeZone ?? ''}
          onConfirm={handleConfirmChangeDate}
          onCancel={() => (isShowChangeDate = false)}
        />
      </Portal>
    {/if}

    {#if asset.exifInfo?.fileSizeInByte}
      <div class="flex gap-4 py-4">
        <div><Icon path={mdiImageOutline} size="24" /></div>

        <div>
          <p class="break-all flex place-items-center gap-2">
            {asset.originalFileName}
            {#if isOwner}
              <CircleIconButton
                icon={mdiInformationOutline}
                title={$t('show_file_location')}
                size="16"
                padding="2"
                on:click={toggleAssetPath}
              />
            {/if}
          </p>
          <div class="flex gap-2 text-sm">
            {#if asset.exifInfo.exifImageHeight && asset.exifInfo.exifImageWidth}
              {#if getMegapixel(asset.exifInfo.exifImageHeight, asset.exifInfo.exifImageWidth)}
                <p>
                  {getMegapixel(asset.exifInfo.exifImageHeight, asset.exifInfo.exifImageWidth)} MP
                </p>
              {/if}
              {@const { width, height } = getDimensions(asset.exifInfo)}
              <p>{width} x {height}</p>
            {/if}
            <p>{getByteUnitString(asset.exifInfo.fileSizeInByte, $locale)}</p>
          </div>
          {#if showAssetPath}
            <p class="text-xs opacity-50 break-all" transition:slide={{ duration: 250 }}>
              {asset.originalPath}
            </p>
          {/if}
        </div>
      </div>
    {/if}

    {#if asset.exifInfo?.make || asset.exifInfo?.model || asset.exifInfo?.fNumber}
      <div class="flex gap-4 py-4">
        <div><Icon path={mdiCameraIris} size="24" /></div>

        <div>
          <p>{asset.exifInfo.make || ''} {asset.exifInfo.model || ''}</p>
          <div class="flex gap-2 text-sm">
            {#if asset.exifInfo?.fNumber}
              <p>ƒ/{asset.exifInfo.fNumber.toLocaleString($locale)}</p>
            {/if}

            {#if asset.exifInfo.exposureTime}
              <p>{`${asset.exifInfo.exposureTime} s`}</p>
            {/if}

            {#if asset.exifInfo.focalLength}
              <p>{`${asset.exifInfo.focalLength.toLocaleString($locale)} mm`}</p>
            {/if}

            {#if asset.exifInfo.iso}
              <p>
                {`ISO ${asset.exifInfo.iso}`}
              </p>
            {/if}
          </div>
        </div>
      </div>
    {/if}

    <DetailPanelLocation {isOwner} {asset} />
  </div>
</section>

{#if latlng && $featureFlags.loaded && $featureFlags.map}
  <div class="h-[360px]">
    {#await import('../shared-components/map/map.svelte')}
      {#await delay(timeToLoadTheMap) then}
        <!-- show the loading spinner only if loading the map takes too much time -->
        <div class="flex items-center justify-center h-full w-full">
          <LoadingSpinner />
        </div>
      {/await}
    {:then component}
      <svelte:component
        this={component.default}
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
        zoom={12.5}
        simplified
        useLocationPin
        onOpenInMapView={() => goto(`${AppRoute.MAP}#12.5/${latlng.lat}/${latlng.lng}`)}
      >
        <svelte:fragment slot="popup" let:marker>
          {@const { lat, lon } = marker}
          <div class="flex flex-col items-center gap-1">
            <p class="font-bold">{lat.toPrecision(6)}, {lon.toPrecision(6)}</p>
            <a
              href="https://www.openstreetmap.org/?mlat={lat}&mlon={lon}&zoom=13#map=15/{lat}/{lon}"
              target="_blank"
              class="font-medium text-immich-primary"
            >
              {$t('open_in_openstreetmap')}
            </a>
          </div>
        </svelte:fragment>
      </svelte:component>
    {/await}
  </div>
{/if}

{#if currentAlbum && currentAlbum.albumUsers.length > 0 && asset.owner}
  <section class="px-6 dark:text-immich-dark-fg mt-4">
    <p class="text-sm">{$t('shared_by').toUpperCase()}</p>
    <div class="flex gap-4 pt-4">
      <div>
        <UserAvatar user={asset.owner} size="md" />
      </div>

      <div class="mb-auto mt-auto">
        <p>
          {asset.owner.name}
        </p>
      </div>
    </div>
  </section>
{/if}

{#if albums.length > 0}
  <section class="px-6 pt-6 dark:text-immich-dark-fg">
    <p class="pb-4 text-sm">{$t('appears_in').toUpperCase()}</p>
    {#each albums as album}
      <a href="{AppRoute.ALBUMS}/{album.id}">
        <div class="flex gap-4 pt-2 hover:cursor-pointer items-center">
          <div>
            <img
              alt={album.albumName}
              class="h-[50px] w-[50px] rounded object-cover"
              src={album.albumThumbnailAssetId &&
                getAssetThumbnailUrl({ id: album.albumThumbnailAssetId, size: AssetMediaSize.Preview })}
              draggable="false"
            />
          </div>

          <div class="mb-auto mt-auto">
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

{#if $preferences?.tags?.enabled}
  <section class="relative px-2 pb-12 dark:bg-immich-dark-bg dark:text-immich-dark-fg">
    <DetailPanelTags {asset} {isOwner} />
  </section>
{/if}

{#if showEditFaces}
  <PersonSidePanel
    assetId={asset.id}
    assetType={asset.type}
    onClose={() => (showEditFaces = false)}
    onRefresh={handleRefreshPeople}
  />
{/if}
