<script lang="ts">
  import ActionButton from '$lib/components/ActionButton.svelte';
  import ShareCover from '$lib/components/sharedlinks-page/covers/share-cover.svelte';
  import { AppRoute } from '$lib/constants';
  import { getSharedLinkActions } from '$lib/services/shared-link.service';
  import { locale } from '$lib/stores/preferences.store';
  import { SharedLinkType, type SharedLinkResponseDto } from '@immich/sdk';
  import { ContextMenuButton, MenuItemType, Text } from '@immich/ui';
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

  const capabilities = $derived.by(() => {
    const items = [];

    if (sharedLink.allowUpload) {
      items.push($t('upload'));
    }

    if (sharedLink.allowDownload) {
      items.push($t('download'));
    }

    if (sharedLink.showMetadata) {
      items.push($t('exif'));
    }

    if (sharedLink.password) {
      items.push($t('password'));
    }

    return items;
  });
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

    <div class="flex flex-col gap-4 justify-between">
      <div class="flex flex-col">
        <Text size="tiny" color={isExpired ? 'danger' : 'muted'} class="font-medium">
          {#if isExpired}
            {$t('expired')}
          {:else if expiresAt}
            {$t('expires_date', { values: { date: getCountDownExpirationDate(expiresAt, now) } })}
          {:else}
            {$t('expires_date', { values: { date: '∞' } })}
          {/if}
        </Text>

        <Text size="large" color="primary" class="flex place-items-center gap-2 break-all font-medium">
          {#if sharedLink.type === SharedLinkType.Album}
            {sharedLink.album?.albumName}
          {:else if sharedLink.type === SharedLinkType.Individual}
            {$t('individual_share')}
          {/if}
        </Text>

        {#if sharedLink.description}
          <Text size="small" class="line-clamp-1">{sharedLink.description}</Text>
        {/if}
      </div>

      <div class="flex flex-wrap items-center gap-2">
        {#each capabilities as capability, index (index)}
          <Text size="small" color="primary" class="font-medium">
            {capability}
          </Text>
          {#if index < capabilities.length - 1}
            <Text size="small" color="muted">•</Text>
          {/if}
        {/each}
      </div>
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
