<script lang="ts">
  import ActionButton from '$lib/components/ActionButton.svelte';
  import ShareCover from '$lib/components/sharedlinks-page/covers/share-cover.svelte';
  import { AppRoute } from '$lib/constants';
  import { getSharedLinkActions } from '$lib/services/shared-link.service';
  import { locale } from '$lib/stores/preferences.store';
  import { SharedLinkType, type SharedLinkResponseDto } from '@immich/sdk';
  import { Badge, ContextMenuButton, MenuItemType, Text } from '@immich/ui';
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

  const { Edit, Copy, Delete } = $derived(getSharedLinkActions($t, sharedLink));
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

    <div class="flex flex-col gap-2">
      <Text size="large" color="primary" class="flex place-items-center gap-2 break-all">
        {#if sharedLink.type === SharedLinkType.Album}
          {sharedLink.album?.albumName}
        {:else if sharedLink.type === SharedLinkType.Individual}
          {$t('individual_share')}
        {/if}
      </Text>

      <div class="flex flex-wrap gap-1">
        {#if isExpired}
          <Badge size="small" color="danger">{$t('expired')}</Badge>
        {:else if expiresAt}
          <Badge size="small" color="secondary">
            {$t('expires_date', { values: { date: getCountDownExpirationDate(expiresAt, now) } })}
          </Badge>
        {:else}
          <Badge size="small" color="secondary">{$t('expires_date', { values: { date: '∞' } })}</Badge>
        {/if}

        {#if sharedLink.slug}
          <Badge size="small" color="secondary">{$t('custom_url')}</Badge>
        {/if}

        {#if sharedLink.allowUpload}
          <Badge size="small" color="secondary">{$t('upload')}</Badge>
        {/if}

        {#if sharedLink.showMetadata && sharedLink.allowDownload}
          <Badge size="small" color="secondary">{$t('download')}</Badge>
        {/if}

        {#if sharedLink.showMetadata}
          <Badge size="small" color="secondary">{$t('exif')}</Badge>
        {/if}

        {#if sharedLink.password}
          <Badge size="small" color="secondary">{$t('password')}</Badge>
        {/if}
      </div>

      {#if sharedLink.description}
        <Text size="small" class="line-clamp-1">{sharedLink.description}</Text>
      {/if}
    </div>
  </svelte:element>
  <div class="flex flex-auto flex-col place-content-center place-items-end text-end ms-4">
    <div class="sm:flex hidden">
      <ActionButton action={Edit} />
      <ActionButton action={Copy} />
      <ActionButton action={Delete} />
    </div>

    <div class="sm:hidden">
      <ContextMenuButton
        aria-label={$t('shared_link_options')}
        position="top-right"
        items={[Edit, Copy, MenuItemType.Divider, Delete]}
      />
    </div>
  </div>
</div>
