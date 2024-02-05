<script lang="ts">
  import { api, type AssetResponseDto, type SharedLinkResponseDto, SharedLinkType, ThumbnailFormat } from '@api';
  import LoadingSpinner from '../shared-components/loading-spinner.svelte';
  import Icon from '$lib/components/elements/icon.svelte';
  import * as luxon from 'luxon';
  import CircleIconButton from '../elements/buttons/circle-icon-button.svelte';
  import { createEventDispatcher } from 'svelte';
  import { goto } from '$app/navigation';
  import { mdiCircleEditOutline, mdiContentCopy, mdiDelete, mdiOpenInNew } from '@mdi/js';
  import noThumbnailUrl from '$lib/assets/no-thumbnail.png';
  import { AppRoute } from '$lib/constants';

  export let link: SharedLinkResponseDto;

  let expirationCountdown: luxon.DurationObjectUnits;
  const dispatch = createEventDispatcher<{
    delete: void;
    copy: void;
    edit: void;
  }>();

  const getThumbnail = async (): Promise<AssetResponseDto> => {
    let assetId = '';

    if (link.album?.albumThumbnailAssetId) {
      assetId = link.album.albumThumbnailAssetId;
    } else if (link.assets.length > 0) {
      assetId = link.assets[0].id;
    }

    const { data } = await api.assetApi.getAssetInfo({ id: assetId });

    return data;
  };

  const getCountDownExpirationDate = () => {
    if (!link.expiresAt) {
      return;
    }

    const expiresAtDate = luxon.DateTime.fromISO(new Date(link.expiresAt).toISOString());
    const now = luxon.DateTime.now();

    expirationCountdown = expiresAtDate.diff(now, ['days', 'hours', 'minutes', 'seconds']).toObject();

    if (expirationCountdown.days && expirationCountdown.days > 0) {
      return expiresAtDate.toRelativeCalendar({ base: now, locale: 'en-US', unit: 'days' });
    } else if (expirationCountdown.hours && expirationCountdown.hours > 0) {
      return expiresAtDate.toRelativeCalendar({ base: now, locale: 'en-US', unit: 'hours' });
    } else if (expirationCountdown.minutes && expirationCountdown.minutes > 0) {
      return expiresAtDate.toRelativeCalendar({ base: now, locale: 'en-US', unit: 'minutes' });
    } else if (expirationCountdown.seconds && expirationCountdown.seconds > 0) {
      return expiresAtDate.toRelativeCalendar({ base: now, locale: 'en-US', unit: 'seconds' });
    }
  };

  const isExpired = (expiresAt: string) => {
    const now = Date.now();
    const expiration = new Date(expiresAt).getTime();

    return now > expiration;
  };
</script>

<div
  class="flex w-full gap-4 border-b border-gray-200 py-4 transition-all hover:border-immich-primary dark:border-gray-600 dark:text-immich-gray dark:hover:border-immich-dark-primary"
>
  <div>
    {#if link?.album?.albumThumbnailAssetId || link.assets.length > 0}
      {#await getThumbnail()}
        <LoadingSpinner />
      {:then asset}
        <img
          id={asset.id}
          src={api.getAssetThumbnailUrl(asset.id, ThumbnailFormat.Webp)}
          alt={asset.id}
          class="h-[100px] w-[100px] rounded-lg object-cover"
          loading="lazy"
          draggable="false"
        />
      {/await}
    {:else}
      <img
        src={noThumbnailUrl}
        alt={'Album without assets'}
        class="h-[100px] w-[100px] rounded-lg object-cover"
        loading="lazy"
        draggable="false"
      />
    {/if}
  </div>

  <div class="flex flex-col justify-between">
    <div class="info-top">
      <div class="font-mono text-xs font-semibold text-gray-500 dark:text-gray-400">
        {#if link.expiresAt}
          {#if isExpired(link.expiresAt)}
            <p class="font-bold text-red-600 dark:text-red-400">Expired</p>
          {:else}
            <p>
              Expires {getCountDownExpirationDate()}
            </p>
          {/if}
        {:else}
          <p>Expires ∞</p>
        {/if}
      </div>

      <div class="text-sm">
        <div class="flex place-items-center gap-2 text-immich-primary dark:text-immich-dark-primary">
          {#if link.type === SharedLinkType.Album}
            <p>
              {link.album?.albumName.toUpperCase()}
            </p>
          {:else if link.type === SharedLinkType.Individual}
            <p>INDIVIDUAL SHARE</p>
          {/if}

          {#if !link.expiresAt || !isExpired(link.expiresAt)}
            <!-- svelte-ignore a11y-no-static-element-interactions -->
            <div
              class="hover:cursor-pointer"
              title="Go to share page"
              on:click={() => goto(`${AppRoute.SHARE}/${link.key}`)}
              on:keydown={() => goto(`${AppRoute.SHARE}/${link.key}`)}
            >
              <Icon path={mdiOpenInNew} />
            </div>
          {/if}
        </div>

        <p class="text-sm">{link.description ?? ''}</p>
      </div>
    </div>

    <div class="info-bottom flex gap-4">
      {#if link.allowUpload}
        <div
          class="flex w-[80px] place-content-center place-items-center rounded-full bg-immich-primary px-2 py-1 text-xs text-white dark:bg-immich-dark-primary dark:text-immich-dark-gray"
        >
          Upload
        </div>
      {/if}

      {#if link.allowDownload}
        <div
          class="flex w-[100px] place-content-center place-items-center rounded-full bg-immich-primary px-2 py-1 text-xs text-white dark:bg-immich-dark-primary dark:text-immich-dark-gray"
        >
          Download
        </div>
      {/if}

      {#if link.showMetadata}
        <div
          class="flex w-[60px] place-content-center place-items-center rounded-full bg-immich-primary px-2 py-1 text-xs text-white dark:bg-immich-dark-primary dark:text-immich-dark-gray"
        >
          EXIF
        </div>
      {/if}

      {#if link.password}
        <div
          class="flex w-[100px] place-content-center place-items-center rounded-full bg-immich-primary px-2 py-1 text-xs text-white dark:bg-immich-dark-primary dark:text-immich-dark-gray"
        >
          Password
        </div>
      {/if}
    </div>
  </div>

  <div class="flex flex-auto flex-col place-content-center place-items-end text-right">
    <div class="flex">
      <CircleIconButton icon={mdiDelete} on:click={() => dispatch('delete')} />
      <CircleIconButton icon={mdiCircleEditOutline} on:click={() => dispatch('edit')} />
      <CircleIconButton icon={mdiContentCopy} on:click={() => dispatch('copy')} />
    </div>
  </div>
</div>
