<script lang="ts">
  import Badge from '$lib/components/elements/badge.svelte';
  import ShareCover from '$lib/components/sharedlinks-page/covers/share-cover.svelte';
  import { AppRoute } from '$lib/constants';
  import { locale } from '$lib/stores/preferences.store';
  import { SharedLinkType, type SharedLinkResponseDto } from '@immich/sdk';
  import { DateTime, type ToRelativeUnit } from 'luxon';
  import { t } from 'svelte-i18n';
  import SharedLinkDelete from '$lib/components/sharedlinks-page/actions/shared-link-delete.svelte';
  import SharedLinkEdit from '$lib/components/sharedlinks-page/actions/shared-link-edit.svelte';
  import SharedLinkCopy from '$lib/components/sharedlinks-page/actions/shared-link-copy.svelte';
  import ButtonContextMenu from '$lib/components/shared-components/context-menu/button-context-menu.svelte';
  import { mdiDotsVertical } from '@mdi/js';

  export let link: SharedLinkResponseDto;
  export let onDelete: () => void;
  export let onEdit: () => void;

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
  class="flex w-full border-b border-gray-200 transition-all hover:border-immich-primary dark:border-gray-600 dark:text-immich-gray dark:hover:border-immich-dark-primary"
>
  <svelte:element
    this={isExpired ? 'div' : 'a'}
    href={isExpired ? undefined : `${AppRoute.SHARE}/${link.key}`}
    class="flex gap-4 w-full py-4"
  >
    <ShareCover class="transition-all duration-300 hover:shadow-lg" {link} />

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
          <p
            class="flex place-items-center gap-2 text-immich-primary dark:text-immich-dark-primary break-all uppercase"
          >
            {#if link.type === SharedLinkType.Album}
              {link.album?.albumName}
            {:else if link.type === SharedLinkType.Individual}
              {$t('individual_share')}
            {/if}
          </p>

          <p class="text-sm">{link.description ?? ''}</p>
        </div>
      </div>

      <div class="flex flex-wrap gap-2 text-xl">
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
  </svelte:element>

  <div class="flex flex-auto flex-col place-content-center place-items-end text-end ms-4">
    <div class="sm:flex hidden">
      <SharedLinkEdit {onEdit} />
      <SharedLinkCopy {link} />
      <SharedLinkDelete {onDelete} />
    </div>

    <div class="sm:hidden">
      <ButtonContextMenu
        color="transparent"
        title={$t('shared_link_options')}
        icon={mdiDotsVertical}
        size="24"
        padding="3"
        hideContent
      >
        <SharedLinkEdit menuItem {onEdit} />
        <SharedLinkCopy menuItem {link} />
        <SharedLinkDelete menuItem {onDelete} />
      </ButtonContextMenu>
    </div>
  </div>
</div>
