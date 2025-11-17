<script lang="ts">
  import ActionButton from '$lib/components/ActionButton.svelte';
  import ShareCover from '$lib/components/sharedlinks-page/covers/share-cover.svelte';
  import { AppRoute } from '$lib/constants';
  import Badge from '$lib/elements/Badge.svelte';
  import { getSharedLinkActions } from '$lib/services/shared-link.service';
  import { locale } from '$lib/stores/preferences.store';
  import { SharedLinkType, type SharedLinkResponseDto } from '@immich/sdk';
  import { DateTime, type ToRelativeUnit } from 'luxon';
  import { t } from 'svelte-i18n';

  interface Props {
    sharedLink: SharedLinkResponseDto;
  }

  let { sharedLink }: Props = $props();

  let now = DateTime.now();
  let expiresAt = $derived(sharedLink.expiresAt ? DateTime.fromISO(sharedLink.expiresAt) : undefined);
  let isExpired = $derived(expiresAt ? now > expiresAt : false);

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

  const SharedLinkActions = $derived(getSharedLinkActions($t, sharedLink));
</script>

<div
  class="flex w-full border-b border-gray-200 transition-all hover:border-immich-primary dark:border-gray-600 dark:text-immich-gray dark:hover:border-immich-dark-primary"
>
  <svelte:element
    this={isExpired ? 'div' : 'a'}
    href={isExpired ? undefined : `${AppRoute.SHARE}/${sharedLink.key}`}
    class="flex gap-4 w-full py-4"
  >
    <ShareCover class="transition-all duration-300 hover:shadow-lg" {sharedLink} />

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

        <div class="text-sm pb-2">
          <p class="flex place-items-center gap-2 text-primary break-all uppercase">
            {#if sharedLink.type === SharedLinkType.Album}
              {sharedLink.album?.albumName}
            {:else if sharedLink.type === SharedLinkType.Individual}
              {$t('individual_share')}
            {/if}
          </p>

          <p class="text-sm">{sharedLink.description ?? ''}</p>
        </div>
      </div>

      <div class="flex flex-wrap gap-2 text-xl">
        {#if sharedLink.allowUpload}
          <Badge rounded="full"><span class="text-xs px-1">{$t('upload')}</span></Badge>
        {/if}

        {#if sharedLink.allowDownload}
          <Badge rounded="full"><span class="text-xs px-1">{$t('download')}</span></Badge>
        {/if}

        {#if sharedLink.showMetadata}
          <Badge rounded="full"><span class="uppercase text-xs px-1">{$t('exif')}</span></Badge>
        {/if}

        {#if sharedLink.password}
          <Badge rounded="full"><span class="text-xs px-1">{$t('password')}</span></Badge>
        {/if}
        {#if sharedLink.slug}
          <Badge rounded="full"><span class="text-xs px-1">{$t('custom_url')}</span></Badge>
        {/if}
      </div>
    </div>
  </svelte:element>
  <div class="flex flex-auto flex-col place-content-center place-items-end text-end ms-4">
    <div class="sm:flex hidden">
      <ActionButton action={SharedLinkActions.Edit} />
      <ActionButton action={SharedLinkActions.Copy} />
      <ActionButton action={SharedLinkActions.Delete} />
    </div>

    <div class="sm:hidden">
      <ActionButton action={SharedLinkActions.ContextMenu} />
    </div>
  </div>
</div>
