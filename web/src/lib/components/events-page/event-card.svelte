<script lang="ts">
  import { goto } from '$app/navigation';
  import { AppRoute } from '$lib/constants';
  import { getAssetThumbnailUrl } from '$lib/utils';
  import { AssetMediaSize, type EventResponseDto } from '@immich/sdk';
  import { mdiCalendarBlank, mdiImageMultiple } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    event: EventResponseDto;
  }

  let { event }: Props = $props();

  const handleClick = () => {
    goto(`${AppRoute.EVENTS}/${event.id}/albums`);
  };

  const thumbnailUrl = event.eventThumbnailAssetId
    ? getAssetThumbnailUrl({ id: event.eventThumbnailAssetId, size: AssetMediaSize.Preview })
    : undefined;

  const dateFormatter = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

  let updatedDate = $derived(dateFormatter.format(new Date(event.updatedAt ?? event.createdAt)));
  let ownerName = $derived(event.owner?.name ?? event.owner?.email ?? $t('unknown'));
  let albumCountLabel = $derived($t('album_count', { values: { count: event.albumCount ?? 0 } }));
</script>

<button
  type="button"
  class="group flex flex-col overflow-hidden rounded-lg md:rounded-xl border border-gray-200 bg-white text-left text-gray-900 shadow-sm md:shadow-md transition-all duration-200 hover:-translate-y-0.5 md:hover:-translate-y-1 hover:shadow-md md:hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-immich-primary dark:border-white/10 dark:bg-immich-dark-gray dark:text-white"
  onclick={handleClick}
>
  <div class="relative w-full aspect-[16/9] md:aspect-[16/10] overflow-hidden bg-gray-100 dark:bg-gray-900">
    {#if thumbnailUrl}
      <img
        src={thumbnailUrl}
        alt={event.eventName}
        class="h-full w-full object-cover transition-all duration-300 group-hover:scale-105 md:group-hover:scale-110"
      />
    {:else}
      <div
        class="flex h-full w-full items-center justify-center bg-gradient-to-br from-immich-primary to-immich-primary/70"
      >
        <svg class="text-white/80" width="48" height="48" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="currentColor" d={mdiCalendarBlank} />
        </svg>
      </div>
    {/if}
  </div>

  <div class="flex flex-col gap-1.5 md:gap-2 p-3 md:p-4">
    <div class="flex items-center justify-between gap-2">
      <span class="text-[11px] md:text-xs font-medium text-gray-500 dark:text-gray-400 truncate">{ownerName}</span>
      <span class="text-[11px] md:text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">{updatedDate}</span>
    </div>

    <h3
      class="text-base md:text-lg font-semibold leading-tight truncate group-hover:text-immich-primary transition-colors"
    >
      {event.eventName}
    </h3>

    {#if event.description}
      <p class="text-xs md:text-sm text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
        {event.description}
      </p>
    {/if}

    <div
      class="mt-0.5 md:mt-1 flex items-center gap-1.5 text-[11px] md:text-xs font-medium text-gray-600 dark:text-gray-400"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" class="opacity-70 md:w-4 md:h-4">
        <path fill="currentColor" d={mdiImageMultiple} />
      </svg>
      <span>{albumCountLabel}</span>
    </div>
  </div>
</button>
