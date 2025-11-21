<script lang="ts">
  import { getAlbumDateRange } from '$lib/utils/date-time';
  import { getEventInfo, type AlbumResponseDto, type EventResponseDto } from '@immich/sdk';
  import { Icon } from '@immich/ui';
  import { mdiCalendarBlank } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    album: AlbumResponseDto;
    event?: EventResponseDto | null;
  }

  let { album, event = null }: Props = $props();

  let fallbackEventName = '';
  let fetchToken = 0;

  let hasAssetMetadata = $derived(album.assetCount > 0);
  let eventName = $derived(event?.eventName?.trim() ?? fallbackEventName);
  let hasEvent = $derived(eventName.length > 0);

  $effect(() => {
    if (!album.eventId) {
      fallbackEventName = '';
      return;
    }

    if (event) {
      fallbackEventName = '';
      return;
    }

    const currentFetch = ++fetchToken;
    fallbackEventName = album.eventId ?? '';

    getEventInfo({ id: album.eventId })
      .then((eventDetails) => {
        if (fetchToken === currentFetch) {
          fallbackEventName = eventDetails.eventName?.trim() ?? album.eventId ?? '';
        }
      })
      .catch(() => {
        if (fetchToken === currentFetch) {
          fallbackEventName = album.eventId ?? '';
        }
      });
  });
</script>

<div class="mb-4 flex flex-col gap-2" data-testid="album-details">
  {#if hasEvent}
    <div class="flex items-center gap-2">
      <Icon icon={mdiCalendarBlank} size="1.25rem" class="text-gray-500 dark:text-gray-400" />
      <span class="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {$t('event')}
      </span>
      <span class="text-base font-semibold text-immich-fg dark:text-immich-dark-fg">{eventName}</span>
    </div>
  {/if}

  {#if hasAssetMetadata}
    <div class="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
      <span>{getAlbumDateRange(album)}</span>
      <span class="text-xs opacity-50">•</span>
      <span>{$t('items_count', { values: { count: album.assetCount } })}</span>
    </div>
  {:else if !hasEvent}
    <span class="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
      {$t('no_items_yet')}
    </span>
  {/if}
</div>
