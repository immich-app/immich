<script lang="ts">
  import Icon from '$lib/components/elements/icon.svelte';
  import { AppRoute } from '$lib/constants';
  import { SharedLinkType, type SharedLinkResponseDto } from '@immich/sdk';
  import { mdiCircleEditOutline, mdiContentCopy, mdiDelete, mdiOpenInNew } from '@mdi/js';
  import * as luxon from 'luxon';
  import { createEventDispatcher } from 'svelte';
  import CircleIconButton from '../elements/buttons/circle-icon-button.svelte';
  import { locale } from '$lib/stores/preferences.store';
  import ShareCover from '$lib/components/sharedlinks-page/covers/share-cover.svelte';
  import { t } from 'svelte-i18n';

  export let link: SharedLinkResponseDto;

  let expirationCountdown: luxon.DurationObjectUnits;
  const dispatch = createEventDispatcher<{
    delete: void;
    copy: void;
    edit: void;
  }>();

  const getCountDownExpirationDate = () => {
    if (!link.expiresAt) {
      return;
    }

    const expiresAtDate = luxon.DateTime.fromISO(new Date(link.expiresAt).toISOString(), { locale: $locale });
    const now = luxon.DateTime.now();

    expirationCountdown = expiresAtDate.diff(now, ['days', 'hours', 'minutes', 'seconds']).toObject();

    if (expirationCountdown.days && expirationCountdown.days > 0) {
      return expiresAtDate.toRelativeCalendar({ base: now, locale: $locale, unit: 'days' });
    } else if (expirationCountdown.hours && expirationCountdown.hours > 0) {
      return expiresAtDate.toRelativeCalendar({ base: now, locale: $locale, unit: 'hours' });
    } else if (expirationCountdown.minutes && expirationCountdown.minutes > 0) {
      return expiresAtDate.toRelativeCalendar({ base: now, locale: $locale, unit: 'minutes' });
    } else if (expirationCountdown.seconds && expirationCountdown.seconds > 0) {
      return expiresAtDate.toRelativeCalendar({ base: now, locale: $locale, unit: 'seconds' });
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
    <ShareCover class="h-[100px] w-[100px] transition-all duration-300 hover:shadow-lg" {link} />
  </div>

  <div class="flex flex-col justify-between">
    <div class="info-top">
      <div class="font-mono text-xs font-semibold text-gray-500 dark:text-gray-400">
        {#if link.expiresAt}
          {#if isExpired(link.expiresAt)}
            <p class="font-bold text-red-600 dark:text-red-400">{$t('expired')}</p>
          {:else}
            <p>
              {$t('expires_date', { values: { date: getCountDownExpirationDate() } })}
            </p>
          {/if}
        {:else}
          <p>{$t('expires_date', { values: { date: '∞' } })}</p>
        {/if}
      </div>

      <div class="text-sm">
        <div class="flex place-items-center gap-2 text-immich-primary dark:text-immich-dark-primary">
          {#if link.type === SharedLinkType.Album}
            <p>
              {link.album?.albumName.toUpperCase()}
            </p>
          {:else if link.type === SharedLinkType.Individual}
            <p>{$t('individual_share').toUpperCase()}</p>
          {/if}

          {#if !link.expiresAt || !isExpired(link.expiresAt)}
            <a href="{AppRoute.SHARE}/{link.key}" title={$t('go_to_share_page')}>
              <Icon path={mdiOpenInNew} />
            </a>
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
          {$t('upload')}
        </div>
      {/if}

      {#if link.allowDownload}
        <div
          class="flex w-[100px] place-content-center place-items-center rounded-full bg-immich-primary px-2 py-1 text-xs text-white dark:bg-immich-dark-primary dark:text-immich-dark-gray"
        >
          {$t('download')}
        </div>
      {/if}

      {#if link.showMetadata}
        <div
          class="flex w-[60px] place-content-center place-items-center rounded-full bg-immich-primary px-2 py-1 text-xs text-white dark:bg-immich-dark-primary dark:text-immich-dark-gray"
        >
          {$t('exif').toUpperCase()}
        </div>
      {/if}

      {#if link.password}
        <div
          class="flex w-[100px] place-content-center place-items-center rounded-full bg-immich-primary px-2 py-1 text-xs text-white dark:bg-immich-dark-primary dark:text-immich-dark-gray"
        >
          {$t('password')}
        </div>
      {/if}
    </div>
  </div>

  <div class="flex flex-auto flex-col place-content-center place-items-end text-right">
    <div class="flex">
      <CircleIconButton title={$t('delete_link')} icon={mdiDelete} on:click={() => dispatch('delete')} />
      <CircleIconButton title={$t('edit_link')} icon={mdiCircleEditOutline} on:click={() => dispatch('edit')} />
      <CircleIconButton title={$t('copy_link')} icon={mdiContentCopy} on:click={() => dispatch('copy')} />
    </div>
  </div>
</div>
