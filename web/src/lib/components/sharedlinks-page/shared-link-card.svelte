<script lang="ts">
  import Badge from '$lib/components/elements/badge.svelte';
  import Icon from '$lib/components/elements/icon.svelte';
  import ShareCover from '$lib/components/sharedlinks-page/covers/share-cover.svelte';
  import { AppRoute } from '$lib/constants';
  import { locale } from '$lib/stores/preferences.store';
  import { SharedLinkType, type SharedLinkResponseDto } from '@immich/sdk';
  import { mdiCircleEditOutline, mdiContentCopy, mdiDelete, mdiOpenInNew } from '@mdi/js';
  import { DateTime, type ToRelativeUnit } from 'luxon';
  import { createEventDispatcher } from 'svelte';
  import { t } from 'svelte-i18n';
  import CircleIconButton from '../elements/buttons/circle-icon-button.svelte';

  export let link: SharedLinkResponseDto;

  const dispatch = createEventDispatcher<{
    delete: void;
    copy: void;
    edit: void;
  }>();

  let now = DateTime.now();
  $: expiresAt = link.expiresAt ? DateTime.fromISO(link.expiresAt) : undefined;
  $: isExpired = expiresAt ? now > expiresAt : false;

  const getCountDownExpirationDate = (expiresAtDate: DateTime, now: DateTime) => {
    const relativeUnits: ToRelativeUnit[] = ['days', 'hours', 'minutes', 'seconds'];
    const expirationCountdown = expiresAtDate.diff(now, relativeUnits).toObject();

    for (const unit of relativeUnits) {
      const value = expirationCountdown[unit];
      if (value && value > 0) {
        return expiresAtDate.toRelativeCalendar({ base: now, locale: $locale, unit });
      }
    }
  };
</script>

<div
  class="flex w-full gap-4 border-b border-gray-200 py-4 transition-all hover:border-immich-primary dark:border-gray-600 dark:text-immich-gray dark:hover:border-immich-dark-primary"
>
  <ShareCover class="size-24 transition-all duration-300 hover:shadow-lg" {link} />

  <div class="flex flex-col justify-between">
    <div class="info-top">
      <div class="font-mono text-xs font-semibold text-gray-500 dark:text-gray-400">
        {#if isExpired}
          <p class="font-bold text-red-600 dark:text-red-400">{$t('expired')}</p>
        {:else if expiresAt}
          <p>
            {$t('expires_date', { values: { date: getCountDownExpirationDate(expiresAt, now) } })}
          </p>
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

          {#if !isExpired}
            <a href="{AppRoute.SHARE}/{link.key}" title={$t('go_to_share_page')}>
              <Icon path={mdiOpenInNew} />
            </a>
          {/if}
        </div>

        <p class="text-sm">{link.description ?? ''}</p>
      </div>
    </div>

    <div class="info-bottom flex gap-4 text-xl">
      {#if link.allowUpload}
        <Badge rounded="full"><span class="text-xs px-1">{$t('upload')}</span></Badge>
      {/if}

      {#if link.allowDownload}
        <Badge rounded="full"><span class="text-xs px-1">{$t('download')}</span></Badge>
      {/if}

      {#if link.showMetadata}
        <Badge rounded="full"><span class="text-xs px-1">{$t('exif').toUpperCase()}</span></Badge>
      {/if}

      {#if link.password}
        <Badge rounded="full"><span class="text-xs px-1">{$t('password')}</span></Badge>
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
