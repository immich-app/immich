<script lang="ts">
  import { page } from '$app/stores';
  import { locale } from '$lib/stores/preferences.store';
  import type { LatLngTuple } from 'leaflet';
  import { DateTime } from 'luxon';
  import Calendar from 'svelte-material-icons/Calendar.svelte';
  import CameraIris from 'svelte-material-icons/CameraIris.svelte';
  import Close from 'svelte-material-icons/Close.svelte';
  import ImageOutline from 'svelte-material-icons/ImageOutline.svelte';
  import MapMarkerOutline from 'svelte-material-icons/MapMarkerOutline.svelte';
  import { createEventDispatcher } from 'svelte';
  import { AssetResponseDto, AlbumResponseDto, api, ThumbnailFormat } from '@api';
  import { asByteUnitString } from '../../utils/byte-units';
  import ImageThumbnail from '../assets/thumbnail/image-thumbnail.svelte';
  import { getAssetFilename } from '$lib/utils/asset-utils';

  export let asset: AssetResponseDto;
  export let albums: AlbumResponseDto[] = [];

  let textarea: HTMLTextAreaElement;
  let description: string;

  $: {
    // Get latest description from server
    if (asset.id && !api.isSharedLink) {
      api.assetApi.getAssetById({ id: asset.id }).then((res) => {
        people = res.data?.people || [];
        textarea.value = res.data?.exifInfo?.description || '';
      });
    }
  }

  $: latlng = (() => {
    const lat = asset.exifInfo?.latitude;
    const lng = asset.exifInfo?.longitude;

    if (lat && lng) {
      return [Number(lat.toFixed(7)), Number(lng.toFixed(7))] as LatLngTuple;
    }
  })();

  $: lat = latlng ? latlng[0] : undefined;
  $: lng = latlng ? latlng[1] : undefined;

  $: people = asset.people || [];

  const dispatch = createEventDispatcher();

  const getMegapixel = (width: number, height: number): number | undefined => {
    const megapixel = Math.round((height * width) / 1_000_000);

    if (megapixel) {
      return megapixel;
    }

    return undefined;
  };

  const autoGrowHeight = (e: Event) => {
    const target = e.target as HTMLTextAreaElement;
    target.style.height = 'auto';
    target.style.height = `${target.scrollHeight}px`;
  };

  const handleFocusIn = () => {
    dispatch('description-focus-in');
  };

  const handleFocusOut = async () => {
    dispatch('description-focus-out');
    try {
      await api.assetApi.updateAsset({
        id: asset.id,
        updateAssetDto: {
          description: description,
        },
      });
    } catch (error) {
      console.error(error);
    }
  };
</script>

<section class="p-2 dark:bg-immich-dark-bg dark:text-immich-dark-fg">
  <div class="flex place-items-center gap-2">
    <button
      class="flex place-content-center place-items-center rounded-full p-3 transition-colors hover:bg-gray-200 dark:text-immich-dark-fg dark:hover:bg-gray-900"
      on:click={() => dispatch('close')}
    >
      <Close size="24" />
    </button>

    <p class="text-lg text-immich-fg dark:text-immich-dark-fg">Info</p>
  </div>

  <section
    class="mx-4 mt-10"
    style:display={$page?.data?.user?.id !== asset.ownerId && textarea?.value == '' ? 'none' : 'block'}
  >
    <textarea
      bind:this={textarea}
      class="max-h-[500px]
      w-full resize-none overflow-hidden border-b border-gray-500 bg-transparent text-base text-black outline-none transition-all focus:border-b-2 focus:border-immich-primary disabled:border-none dark:text-white dark:focus:border-immich-dark-primary"
      placeholder={$page?.data?.user?.id !== asset.ownerId ? '' : 'Add a description'}
      on:focusin={handleFocusIn}
      on:focusout={handleFocusOut}
      on:input={autoGrowHeight}
      bind:value={description}
      disabled={$page?.data?.user?.id !== asset.ownerId}
    />
  </section>

  {#if !api.isSharedLink && people.length > 0}
    <section class="px-4 py-4 text-sm">
      <h2>PEOPLE</h2>

      <div class="mt-4 flex flex-wrap gap-2">
        {#each people as person (person.id)}
          <a href="/people/{person.id}" class="w-[90px]" on:click={() => dispatch('close-viewer')}>
            <ImageThumbnail
              curve
              shadow
              url={api.getPeopleThumbnailUrl(person.id)}
              altText={person.name}
              title={person.name}
              widthStyle="90px"
              heightStyle="90px"
              thumbhash={null}
            />
            <p class="mt-1 truncate font-medium" title={person.name}>{person.name}</p>
            {#if person.birthDate}
              {@const personBirthDate = DateTime.fromISO(person.birthDate)}
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
                Age {Math.floor(DateTime.fromISO(asset.fileCreatedAt).diff(personBirthDate, 'years').years)}
              </p>
            {/if}
          </a>
        {/each}
      </div>
    </section>
  {/if}

  <div class="px-4 py-4">
    {#if !asset.exifInfo}
      <p class="text-sm">NO EXIF INFO AVAILABLE</p>
    {:else}
      <p class="text-sm">DETAILS</p>
    {/if}

    {#if asset.exifInfo?.dateTimeOriginal}
      {@const assetDateTimeOriginal = DateTime.fromISO(asset.exifInfo.dateTimeOriginal, {
        zone: asset.exifInfo.timeZone ?? undefined,
      })}
      <div class="flex gap-4 py-4">
        <div>
          <Calendar size="24" />
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
      </div>{/if}

    {#if asset.exifInfo?.fileSizeInByte}
      <div class="flex gap-4 py-4">
        <div><ImageOutline size="24" /></div>

        <div>
          <p class="break-all">
            {getAssetFilename(asset)}
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
        </div>
      </div>
    {/if}

    {#if asset.exifInfo?.make || asset.exifInfo?.model || asset.exifInfo?.fNumber}
      <div class="flex gap-4 py-4">
        <div><CameraIris size="24" /></div>

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

    {#if asset.exifInfo?.city}
      <div class="flex gap-4 py-4">
        <div><MapMarkerOutline size="24" /></div>

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
    {/if}
  </div>
</section>

{#if latlng}
  <div class="h-[360px]">
    {#await import('../shared-components/leaflet') then { Map, TileLayer, Marker }}
      <Map center={latlng} zoom={14}>
        <TileLayer
          urlTemplate={'https://tile.openstreetmap.org/{z}/{x}/{y}.png'}
          options={{
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          }}
        />
        <Marker {latlng}>
          <p>
            {lat}, {lng}
          </p>
          <a href="https://www.openstreetmap.org/?mlat={lat}&mlon={lng}&zoom=15#map=15/{lat}/{lng}">
            Open in OpenStreetMap
          </a>
        </Marker>
      </Map>
    {/await}
  </div>
{/if}

<section class="p-2 dark:text-immich-dark-fg">
  <div class="px-4 py-4">
    {#if albums.length > 0}
      <p class="pb-4 text-sm">APPEARS IN</p>
    {/if}
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
  </div>
</section>
