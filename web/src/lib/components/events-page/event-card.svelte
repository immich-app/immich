<script lang="ts">
  import { goto } from '$app/navigation';
  import { AppRoute } from '$lib/constants';
  import { getAssetThumbnailUrl } from '$lib/utils';
  import { AssetMediaSize, type EventResponseDto } from '@immich/sdk';
  import { Icon } from '@immich/ui';
  import { mdiAccountCircleOutline, mdiImageMultiple } from '@mdi/js';
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
  let albumCountLabel = $derived($t('album_count', { values: { count: event.albumCount ?? 0 } }));
  let isShared = $derived(!event.isOwner);
</script>

<button
  type="button"
  class="group relative flex flex-col overflow-hidden rounded-2xl bg-immich-bg text-left transition-all duration-500 hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-immich-primary focus-visible:ring-offset-2 dark:bg-immich-dark-gray {isShared
    ? 'shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30 dark:shadow-emerald-500/15 dark:hover:shadow-emerald-500/25'
    : 'shadow-lg shadow-gray-900/10 hover:shadow-xl hover:shadow-gray-900/20 dark:shadow-black/40 dark:hover:shadow-black/60'}"
  onclick={handleClick}
>
  <!-- Image Container -->
  <div class="relative w-full aspect-[3/2] overflow-hidden bg-gray-100 dark:bg-gray-900">
    {#if thumbnailUrl}
      <img
        src={thumbnailUrl}
        alt={event.eventName}
        class="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
      />
      <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>

      <!-- Title overlay on image -->
      <div class="absolute bottom-0 left-0 right-0 p-5">
        <h3 class="text-2xl font-semibold text-white drop-shadow-2xl line-clamp-2 leading-tight">
          {event.eventName}
        </h3>
      </div>

      <!-- Shared badge on image -->
      {#if isShared}
        <div class="absolute top-4 left-4">
          <div
            class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-xl bg-gradient-to-r from-emerald-700 to-teal-800 shadow-2xl"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" class="text-white">
              <path
                fill="currentColor"
                d="M12,5.5A3.5,3.5 0 0,1 15.5,9A3.5,3.5 0 0,1 12,12.5A3.5,3.5 0 0,1 8.5,9A3.5,3.5 0 0,1 12,5.5M5,8C5.56,8 6.08,8.15 6.53,8.42C6.38,9.85 6.8,11.27 7.66,12.38C7.16,13.34 6.16,14 5,14A3,3 0 0,1 2,11A3,3 0 0,1 5,8M19,8A3,3 0 0,1 22,11A3,3 0 0,1 19,14C17.84,14 16.84,13.34 16.34,12.38C17.2,11.27 17.62,9.85 17.47,8.42C17.92,8.15 18.44,8 19,8M5.5,18.25C5.5,16.18 8.41,14.5 12,14.5C15.59,14.5 18.5,16.18 18.5,18.25V20H5.5V18.25M0,20V18.5C0,17.11 1.89,15.94 4.45,15.6C3.86,16.28 3.5,17.22 3.5,18.25V20H0M24,20H20.5V18.25C20.5,17.22 20.14,16.28 19.55,15.6C22.11,15.94 24,17.11 24,18.5V20Z"
              />
            </svg>
            <span class="text-sm font-semibold text-white tracking-wide">SHARED</span>
          </div>
        </div>
      {/if}
    {:else}
      <div
        class="flex h-full w-full items-center justify-center bg-gradient-to-br {isShared
          ? 'from-emerald-400 to-teal-800'
          : 'from-indigo-600 to-purple-800'}"
      ></div>

      <!-- Title for no-image cards -->
      <div class="absolute bottom-0 left-0 right-0 p-5">
        <h3 class="text-2xl font-semibold text-white drop-shadow-2xl line-clamp-2 leading-tight">
          {event.eventName}
        </h3>
      </div>

      {#if isShared}
        <div class="absolute top-4 left-4">
          <div
            class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-xl bg-white/30 shadow-2xl ring-1 ring-white/40"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" class="text-white">
              <path
                fill="currentColor"
                d="M12,5.5A3.5,3.5 0 0,1 15.5,9A3.5,3.5 0 0,1 12,12.5A3.5,3.5 0 0,1 8.5,9A3.5,3.5 0 0,1 12,5.5M5,8C5.56,8 6.08,8.15 6.53,8.42C6.38,9.85 6.8,11.27 7.66,12.38C7.16,13.34 6.16,14 5,14A3,3 0 0,1 2,11A3,3 0 0,1 5,8M19,8A3,3 0 0,1 22,11A3,3 0 0,1 19,14C17.84,14 16.84,13.34 16.34,12.38C17.2,11.27 17.62,9.85 17.47,8.42C17.92,8.15 18.44,8 19,8M5.5,18.25C5.5,16.18 8.41,14.5 12,14.5C15.59,14.5 18.5,16.18 18.5,18.25V20H5.5V18.25M0,20V18.5C0,17.11 1.89,15.94 4.45,15.6C3.86,16.28 3.5,17.22 3.5,18.25V20H0M24,20H20.5V18.25C20.5,17.22 20.14,16.28 19.55,15.6C22.11,15.94 24,17.11 24,18.5V20Z"
              />
            </svg>
            <span class="text-sm font-bold text-white tracking-wide drop-shadow-md">SHARED</span>
          </div>
        </div>
      {/if}
    {/if}
  </div>

  <!-- Content Section -->
  <div class="flex flex-col gap-2 p-4 bg-immich-bg dark:bg-immich-dark-gray">
    <!-- Description (if exists) -->
    {#if event.description}
      <p class="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
        {event.description}
      </p>
    {:else}
      <p class="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">&nbsp;</p>
    {/if}
    <!-- Metadata -->
    <div class="flex items-center justify-between gap-3 text-xs">
      <div class="flex items-center gap-3">
        <!-- Album count -->
        <div class="flex items-center gap-1.5 text-immich-primary dark:text-immich-primary">
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path fill="currentColor" d={mdiImageMultiple} />
          </svg>
          <span class="font-semibold">{event.albumCount}</span>
        </div>

        <!-- Owner -->
        <div class="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
          <Icon icon={mdiAccountCircleOutline} size="16" class="text-black" />
          <!-- <svg width="14" height="14" viewBox="0 0 24 24" class="opacity-100">
            <path
              fill="currentColor"
              d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z"
            />
          </svg> -->
          <span class="font-semibold truncate max-w-[120px] text-black-600 dark:text-black-600">{event.owner.name}</span
          >
        </div>
      </div>

      <!-- Date -->
      <time class="font-medium text-gray-500 dark:text-gray-500">{updatedDate}</time>
    </div>
  </div>
</button>
