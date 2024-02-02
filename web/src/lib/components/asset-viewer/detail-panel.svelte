<script lang="ts">
  import { locale } from '$lib/stores/preferences.store';
  import { featureFlags } from '$lib/stores/server-config.store';
  import { getAssetFilename } from '$lib/utils/asset-utils';
  import { type AlbumResponseDto, type AssetResponseDto, ThumbnailFormat, api } from '@api';
  import { DateTime } from 'luxon';
  import { createEventDispatcher, onDestroy } from 'svelte';
  import { slide } from 'svelte/transition';
  import { asByteUnitString } from '../../utils/byte-units';
  import ImageThumbnail from '../assets/thumbnail/image-thumbnail.svelte';
  import UserAvatar from '../shared-components/user-avatar.svelte';
  import ChangeDate from '$lib/components/shared-components/change-date.svelte';
  import {
    mdiCalendar,
    mdiCameraIris,
    mdiClose,
    mdiEye,
    mdiEyeOff,
    mdiImageOutline,
    mdiMapMarkerOutline,
    mdiInformationOutline,
    mdiPencil,
  } from '@mdi/js';
  import Icon from '$lib/components/elements/icon.svelte';
  import PersonSidePanel from '../faces-page/person-side-panel.svelte';
  import CircleIconButton from '../elements/buttons/circle-icon-button.svelte';
  import Map from '../shared-components/map/map.svelte';
  import { boundingBoxesArray } from '$lib/stores/people.store';
  import { websocketStore } from '$lib/stores/websocket';
  import { AppRoute, QueryParameter } from '$lib/constants';
  import ChangeLocation from '../shared-components/change-location.svelte';
  import { handleError } from '../../utils/handle-error';
  import { user } from '$lib/stores/user.store';
  import { autoGrowHeight } from '$lib/utils/autogrow';
  import { clickOutside } from '$lib/utils/click-outside';

  export let asset: AssetResponseDto;
  export let albums: AlbumResponseDto[] = [];
  export let albumId: string | null = null;

  let showAssetPath = false;
  let textArea: HTMLTextAreaElement;
  let description: string;
  let originalDescription: string;
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
    description = newAsset?.exifInfo?.description || '';

    // Get latest description from server
    if (newAsset.id && !api.isSharedLink) {
      const { data } = await api.assetApi.getAssetInfo({ id: asset.id });
      people = data?.people || [];

      description = data.exifInfo?.description || '';
    }
    originalDescription = description;
  };

  $: handleNewAsset(asset);

  $: latlng = (() => {
    const lat = asset.exifInfo?.latitude;
    const lng = asset.exifInfo?.longitude;

    if (lat && lng) {
      return { lat: Number(lat.toFixed(7)), lng: Number(lng.toFixed(7)) };
    }
  })();

  $: people = asset.people || [];
  $: showingHiddenPeople = false;

  const unsubscribe = websocketStore.onAssetUpdate.subscribe((assetUpdate) => {
    if (assetUpdate && assetUpdate.id === asset.id) {
      asset = assetUpdate;
    }
  });

  onDestroy(() => {
    unsubscribe();
  });

  const dispatch = createEventDispatcher<{
    close: void;
    descriptionFocusIn: void;
    descriptionFocusOut: void;
    click: AlbumResponseDto;
    closeViewer: void;
  }>();

  const handleKeypress = async (event: KeyboardEvent) => {
    if (event.target !== textArea) {
      return;
    }
    const ctrl = event.ctrlKey;
    switch (event.key) {
      case 'Enter': {
        if (ctrl && event.target === textArea) {
          handleFocusOut();
        }
      }
    }
  };

  const getMegapixel = (width: number, height: number): number | undefined => {
    const megapixel = Math.round((height * width) / 1_000_000);

    if (megapixel) {
      return megapixel;
    }

    return undefined;
  };

  const handleRefreshPeople = async () => {
    await api.assetApi.getAssetInfo({ id: asset.id }).then((res) => {
      people = res.data?.people || [];
      textArea.value = res.data?.exifInfo?.description || '';
    });
    showEditFaces = false;
  };

  const handleFocusIn = () => {
    dispatch('descriptionFocusIn');
  };

  const handleFocusOut = async () => {
    textArea.blur();
    if (description === originalDescription) {
      return;
    }
    originalDescription = description;
    dispatch('descriptionFocusOut');
    try {
      await api.assetApi.updateAsset({
        id: asset.id,
        updateAssetDto: { description },
      });
    } catch (error) {
      handleError(error, 'Cannot update the description');
    }
  };

  const toggleAssetPath = () => (showAssetPath = !showAssetPath);

  let isShowChangeDate = false;

  async function handleConfirmChangeDate(dateTimeOriginal: string) {
    isShowChangeDate = false;
    try {
      await api.assetApi.updateAsset({ id: asset.id, updateAssetDto: { dateTimeOriginal } });
    } catch (error) {
      handleError(error, 'Unable to change date');
    }
  }

  let isShowChangeLocation = false;

  async function handleConfirmChangeLocation(gps: { lng: number; lat: number }) {
    isShowChangeLocation = false;

    try {
      await api.assetApi.updateAsset({
        id: asset.id,
        updateAssetDto: {
          latitude: gps.lat,
          longitude: gps.lng,
        },
      });
    } catch (error) {
      handleError(error, 'Unable to change location');
    }
  }
</script>

<svelte:window on:keydown={handleKeypress} />

<section class="relative p-2 dark:bg-immich-dark-bg dark:text-immich-dark-fg">
  <div class="flex place-items-center gap-2">
    <button
      class="flex place-content-center place-items-center rounded-full p-3 transition-colors hover:bg-gray-200 dark:text-immich-dark-fg dark:hover:bg-gray-900"
      on:click={() => dispatch('close')}
    >
      <Icon path={mdiClose} size="24" />
    </button>

    <p class="text-lg text-immich-fg dark:text-immich-dark-fg">Info</p>
  </div>

  {#if asset.isOffline}
    <section class="px-4 py-4">
      <div role="alert">
        <div class="rounded-t bg-red-500 px-4 py-2 font-bold text-white">Asset offline</div>
        <div class="rounded-b border border-t-0 border-red-400 bg-red-100 px-4 py-3 text-red-700">
          <p>
            This asset is offline. Immich can not access its file location. Please ensure the asset is available and
            then rescan the library.
          </p>
        </div>
      </div>
    </section>
  {/if}

  {#if isOwner}
    <section class="px-4 mt-10">
      {#key asset.id}
        <textarea
          disabled={!isOwner || api.isSharedLink}
          bind:this={textArea}
          class="max-h-[500px]
      w-full resize-none overflow-hidden border-b border-gray-500 bg-transparent text-base text-black outline-none transition-all focus:border-b-2 focus:border-immich-primary disabled:border-none dark:text-white dark:focus:border-immich-dark-primary"
          placeholder={isOwner ? 'Add a description' : ''}
          on:focusin={handleFocusIn}
          on:focusout={handleFocusOut}
          on:input={() => autoGrowHeight(textArea)}
          bind:value={description}
          use:autoGrowHeight
          use:clickOutside
          on:outclick={handleFocusOut}
        />
      {/key}
    </section>
  {:else if description}
    <p class="px-4 break-words whitespace-pre-line w-full text-black dark:text-white text-base">{description}</p>
  {/if}

  {#if !api.isSharedLink && people.length > 0}
    <section class="px-4 py-4 text-sm">
      <div class="flex h-10 w-full items-center justify-between">
        <h2>PEOPLE</h2>
        <div class="flex gap-2 items-center">
          {#if people.some((person) => person.isHidden)}
            <CircleIconButton
              title="Show hidden people"
              icon={showingHiddenPeople ? mdiEyeOff : mdiEye}
              padding="1"
              buttonSize="32"
              on:click={() => (showingHiddenPeople = !showingHiddenPeople)}
            />
          {/if}
          <CircleIconButton
            title="Edit people"
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
            <div
              class="w-[90px]"
              role="button"
              tabindex={index}
              on:focus={() => ($boundingBoxesArray = people[index].faces)}
              on:mouseover={() => ($boundingBoxesArray = people[index].faces)}
              on:mouseleave={() => ($boundingBoxesArray = [])}
            >
              <a
                href="{AppRoute.PEOPLE}/{person.id}?{QueryParameter.PREVIOUS_ROUTE}={albumId
                  ? `${AppRoute.ALBUMS}/${albumId}`
                  : AppRoute.PHOTOS}"
                on:click={() => dispatch('closeViewer')}
              >
                <div class="relative">
                  <ImageThumbnail
                    curve
                    shadow
                    url={api.getPeopleThumbnailUrl(person.id)}
                    altText={person.name}
                    title={person.name}
                    widthStyle="90px"
                    heightStyle="90px"
                    thumbhash={null}
                    hidden={person.isHidden}
                  />
                </div>
                <p class="mt-1 truncate font-medium" title={person.name}>{person.name}</p>
                {#if person.birthDate}
                  {@const personBirthDate = DateTime.fromISO(person.birthDate)}
                  {@const age = Math.floor(DateTime.fromISO(asset.fileCreatedAt).diff(personBirthDate, 'years').years)}
                  {@const ageInMonths = Math.floor(
                    DateTime.fromISO(asset.fileCreatedAt).diff(personBirthDate, 'months').months,
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
                        Age {ageInMonths} months
                      {:else}
                        Age {age}
                      {/if}
                    </p>
                  {/if}
                {/if}
              </a>
            </div>
          {/if}
        {/each}
      </div>
    </section>
  {/if}

  <div class="px-4 py-4">
    {#if !asset.exifInfo && !asset.isExternal}
      <p class="text-sm">NO EXIF INFO AVAILABLE</p>
    {:else if !asset.exifInfo && asset.isExternal}
      <div class="flex gap-4 py-4">
        <div>
          <p class="break-all">
            Metadata not loaded for {asset.originalPath}
          </p>
        </div>
      </div>
    {:else}
      <div class="flex h-10 w-full items-center justify-between text-sm">
        <h2>DETAILS</h2>
      </div>
    {/if}

    {#if asset.exifInfo?.dateTimeOriginal && !asset.isReadOnly}
      {@const assetDateTimeOriginal = DateTime.fromISO(asset.exifInfo.dateTimeOriginal, {
        zone: asset.exifInfo.timeZone ?? undefined,
      })}
      <div
        class="flex justify-between place-items-start gap-4 py-4"
        tabindex="0"
        role="button"
        on:click={() => (isOwner ? (isShowChangeDate = true) : null)}
        on:keydown={(event) => (isOwner ? event.key === 'Enter' && (isShowChangeDate = true) : null)}
        title={isOwner ? 'Edit date' : ''}
        class:hover:dark:text-immich-dark-primary={isOwner}
        class:hover:text-immich-primary={isOwner}
      >
        <div class="flex gap-4">
          <div>
            <Icon path={mdiCalendar} size="24" />
          </div>

          <div>
            <p>
              {assetDateTimeOriginal.toLocaleString(
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
                {assetDateTimeOriginal.toLocaleString(
                  {
                    weekday: 'short',
                    hour: 'numeric',
                    minute: '2-digit',
                    timeZoneName: 'longOffset',
                  },
                  { locale: $locale },
                )}
              </p>
            </div>
          </div>
        </div>

        {#if isOwner}
          <button class="focus:outline-none p-1">
            <Icon path={mdiPencil} size="20" />
          </button>
        {/if}
      </div>
    {:else if !asset.exifInfo?.dateTimeOriginal && !asset.isReadOnly && isOwner}
      <div class="flex justify-between place-items-start gap-4 py-4">
        <div class="flex gap-4">
          <div>
            <Icon path={mdiCalendar} size="24" />
          </div>
        </div>
        <button class="focus:outline-none p-1">
          <Icon path={mdiPencil} size="20" />
        </button>
      </div>
    {:else if asset.exifInfo?.dateTimeOriginal && asset.isReadOnly}
      {@const assetDateTimeOriginal = DateTime.fromISO(asset.exifInfo.dateTimeOriginal, {
        zone: asset.exifInfo.timeZone ?? undefined,
      })}
      <div class="flex justify-between place-items-start gap-4 py-4">
        <div class="flex gap-4">
          <div>
            <Icon path={mdiCalendar} size="24" />
          </div>

          <div>
            <p>
              {assetDateTimeOriginal.toLocaleString(
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
                {assetDateTimeOriginal.toLocaleString(
                  {
                    weekday: 'short',
                    hour: 'numeric',
                    minute: '2-digit',
                    timeZoneName: 'longOffset',
                  },
                  { locale: $locale },
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    {/if}

    {#if isShowChangeDate}
      {@const assetDateTimeOriginal = asset.exifInfo?.dateTimeOriginal
        ? DateTime.fromISO(asset.exifInfo.dateTimeOriginal, {
            zone: asset.exifInfo.timeZone ?? undefined,
          })
        : DateTime.now()}
      <ChangeDate
        initialDate={assetDateTimeOriginal}
        on:confirm={({ detail: date }) => handleConfirmChangeDate(date)}
        on:cancel={() => (isShowChangeDate = false)}
      />
    {/if}

    {#if asset.exifInfo?.fileSizeInByte}
      <div class="flex gap-4 py-4">
        <div><Icon path={mdiImageOutline} size="24" /></div>

        <div>
          <p class="break-all flex place-items-center gap-2">
            {#if isOwner}
              {asset.originalFileName}
              <button title="Show File Location" on:click={toggleAssetPath}>
                <Icon path={mdiInformationOutline} />
              </button>
            {:else}
              {getAssetFilename(asset)}
            {/if}
          </p>
          <div class="flex gap-2 text-sm">
            {#if asset.exifInfo.exifImageHeight && asset.exifInfo.exifImageWidth}
              {#if getMegapixel(asset.exifInfo.exifImageHeight, asset.exifInfo.exifImageWidth)}
                <p>
                  {getMegapixel(asset.exifInfo.exifImageHeight, asset.exifInfo.exifImageWidth)} MP
                </p>
              {/if}

              <p>{asset.exifInfo.exifImageHeight} x {asset.exifInfo.exifImageWidth}</p>
            {/if}
            <p>{asByteUnitString(asset.exifInfo.fileSizeInByte, $locale)}</p>
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
              <p>{`ƒ/${asset.exifInfo.fNumber.toLocaleString($locale)}` || ''}</p>
            {/if}

            {#if asset.exifInfo.exposureTime}
              <p>{`${asset.exifInfo.exposureTime}`}</p>
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

    {#if asset.exifInfo?.city && !asset.isReadOnly}
      <div
        class="flex justify-between place-items-start gap-4 py-4"
        on:click={() => (isOwner ? (isShowChangeLocation = true) : null)}
        on:keydown={(event) => (isOwner ? event.key === 'Enter' && (isShowChangeLocation = true) : null)}
        tabindex="0"
        title={isOwner ? 'Edit location' : ''}
        role="button"
        class:hover:dark:text-immich-dark-primary={isOwner}
        class:hover:text-immich-primary={isOwner}
      >
        <div class="flex gap-4">
          <div><Icon path={mdiMapMarkerOutline} size="24" /></div>

          <div>
            <p>{asset.exifInfo.city}</p>
            {#if asset.exifInfo?.state}
              <div class="flex gap-2 text-sm">
                <p>{asset.exifInfo.state}</p>
              </div>
            {/if}
            {#if asset.exifInfo?.country}
              <div class="flex gap-2 text-sm">
                <p>{asset.exifInfo.country}</p>
              </div>
            {/if}
          </div>
        </div>

        {#if isOwner}
          <div>
            <Icon path={mdiPencil} size="20" />
          </div>
        {/if}
      </div>
    {:else if !asset.exifInfo?.city && !asset.isReadOnly && isOwner}
      <div
        class="flex justify-between place-items-start gap-4 py-4 rounded-lg hover:dark:text-immich-dark-primary hover:text-immich-primary"
        on:click={() => (isShowChangeLocation = true)}
        on:keydown={(event) => event.key === 'Enter' && (isShowChangeLocation = true)}
        tabindex="0"
        role="button"
        title="Add location"
      >
        <div class="flex gap-4">
          <div>
            <div><Icon path={mdiMapMarkerOutline} size="24" /></div>
          </div>

          <p>Add a location</p>
        </div>
        <div class="focus:outline-none p-1">
          <Icon path={mdiPencil} size="20" />
        </div>
      </div>
    {:else if asset.exifInfo?.city && asset.isReadOnly}
      <div class="flex justify-between place-items-start gap-4 py-4">
        <div class="flex gap-4">
          <div><Icon path={mdiMapMarkerOutline} size="24" /></div>

          <div>
            <p>{asset.exifInfo.city}</p>
            {#if asset.exifInfo?.state}
              <div class="flex gap-2 text-sm">
                <p>{asset.exifInfo.state}</p>
              </div>
            {/if}
            {#if asset.exifInfo?.country}
              <div class="flex gap-2 text-sm">
                <p>{asset.exifInfo.country}</p>
              </div>
            {/if}
          </div>
        </div>
      </div>
    {/if}
    {#if isShowChangeLocation}
      <ChangeLocation
        {asset}
        on:confirm={({ detail: gps }) => handleConfirmChangeLocation(gps)}
        on:cancel={() => (isShowChangeLocation = false)}
      />
    {/if}
  </div>
</section>

{#if latlng && $featureFlags.loaded && $featureFlags.map}
  <div class="h-[360px]">
    <Map
      mapMarkers={[{ lat: latlng.lat, lon: latlng.lng, id: asset.id }]}
      center={latlng}
      zoom={15}
      simplified
      useLocationPin
    >
      <svelte:fragment slot="popup" let:marker>
        {@const { lat, lon } = marker}
        <div class="flex flex-col items-center gap-1">
          <p class="font-bold">{lat.toPrecision(6)}, {lon.toPrecision(6)}</p>
          <a
            href="https://www.openstreetmap.org/?mlat={lat}&mlon={lon}&zoom=15#map=15/{lat}/{lon}"
            target="_blank"
            class="font-medium text-immich-primary"
          >
            Open in OpenStreetMap
          </a>
        </div>
      </svelte:fragment>
    </Map>
  </div>
{/if}

{#if asset.owner && !isOwner}
  <section class="px-6 pt-6 dark:text-immich-dark-fg">
    <p class="text-sm">SHARED BY</p>
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
  <section class="p-6 dark:text-immich-dark-fg">
    <p class="pb-4 text-sm">APPEARS IN</p>
    {#each albums as album}
      <a data-sveltekit-preload-data="hover" href={`/albums/${album.id}`}>
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <div
          class="flex gap-4 py-2 hover:cursor-pointer"
          on:click={() => dispatch('click', album)}
          on:keydown={() => dispatch('click', album)}
        >
          <div>
            <img
              alt={album.albumName}
              class="h-[50px] w-[50px] rounded object-cover"
              src={album.albumThumbnailAssetId &&
                api.getAssetThumbnailUrl(album.albumThumbnailAssetId, ThumbnailFormat.Jpeg)}
              draggable="false"
            />
          </div>

          <div class="mb-auto mt-auto">
            <p class="dark:text-immich-dark-primary">{album.albumName}</p>
            <div class="flex gap-2 text-sm">
              <p>{album.assetCount} items</p>
              {#if album.shared}
                <p>· Shared</p>
              {/if}
            </div>
          </div>
        </div>
      </a>
    {/each}
  </section>
{/if}

{#if showEditFaces}
  <PersonSidePanel
    assetId={asset.id}
    assetType={asset.type}
    on:close={() => {
      showEditFaces = false;
    }}
    on:refresh={handleRefreshPeople}
  />
{/if}
