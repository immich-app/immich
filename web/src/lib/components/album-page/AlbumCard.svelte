<script lang="ts">
  import AlbumCover from '$lib/components/album-page/AlbumCover.svelte';
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import { toggleAlbumFavorite } from '$lib/services/album.service';
  import { getContextMenuPositionFromEvent, type ContextMenuPosition } from '$lib/utils/context-menu';
  import { getShortDateRange } from '$lib/utils/date-time';
  import { type AlbumResponseDto } from '@immich/sdk';
  import { Icon, IconButton } from '@immich/ui';
  import { mdiDotsVertical, mdiHeart, mdiHeartOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    album: AlbumResponseDto;
    showOwner?: boolean;
    showDateRange?: boolean;
    showItemCount?: boolean;
    preload?: boolean;
    onShowContextMenu?: ((position: ContextMenuPosition) => unknown) | undefined;
  }

  let {
    album,
    showOwner = false,
    showDateRange = false,
    showItemCount = false,
    preload = false,
    onShowContextMenu = undefined,
  }: Props = $props();

  let togglingFavorite = $state(false);

  const showAlbumContextMenu = (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onShowContextMenu?.(getContextMenuPositionFromEvent(e));
  };

  const onToggleFavorite = async (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (togglingFavorite) {
      return;
    }
    togglingFavorite = true;
    try {
      await toggleAlbumFavorite(album);
    } finally {
      togglingFavorite = false;
    }
  };
</script>

<div
  class="group relative rounded-2xl border border-transparent p-5 hover:bg-gray-100 hover:border-gray-200 dark:hover:border-gray-800 dark:hover:bg-gray-900"
  data-testid="album-card"
>
  <div class="relative">
    <AlbumCover {album} {preload} class="transition-all duration-300 hover:shadow-lg" />
    {#if onShowContextMenu}
      <div
        id="icon-{album.id}"
        class="absolute inset-e-3 top-3 opacity-0 group-hover:opacity-100 focus-within:opacity-100"
        data-testid="context-button-parent"
      >
        <IconButton
          color="secondary"
          aria-label={$t('show_album_options')}
          icon={mdiDotsVertical}
          shape="round"
          variant="filled"
          size="medium"
          class="icon-white-drop-shadow"
          onclick={showAlbumContextMenu}
        />
      </div>
    {/if}
    <button
      type="button"
      class="absolute inset-e-3 bottom-3 inline-flex items-center justify-center rounded-full p-2 bg-white/50 dark:bg-gray-900/90 backdrop-blur-md shadow-lg ring-1 ring-black/5 transition-all duration-150 hover:scale-110 active:scale-95 disabled:opacity-50 {album.isFavorite
        ? 'text-red-500 dark:text-red-400'
        : 'text-gray-500 dark:text-gray-300 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:text-red-500 dark:hover:text-red-400'}"
      aria-label={$t(album.isFavorite ? 'unfavorite' : 'favorite')}
      aria-pressed={album.isFavorite}
      disabled={togglingFavorite}
      onclick={onToggleFavorite}
    >
      <Icon
        icon={album.isFavorite ? mdiHeart : mdiHeartOutline}
        size="1.125em"
        class={album.isFavorite ? 'drop-shadow-[0_1px_2px_rgba(239,68,68,0.5)]' : ''}
      />
    </button>
  </div>

  <div class="mt-4">
    <p
      class="w-full leading-6 text-lg line-clamp-2 font-semibold text-black dark:text-white group-hover:text-primary"
      data-testid="album-name"
      title={album.albumName}
    >
      {album.albumName}
    </p>

    {#if showDateRange && album.startDate && album.endDate}
      <p class="flex text-sm dark:text-immich-dark-fg capitalize">
        {getShortDateRange(album.startDate, album.endDate)}
      </p>
    {/if}

    <span class="flex gap-2 text-sm dark:text-immich-dark-fg" data-testid="album-details">
      {#if showItemCount}
        <p>
          {$t('items_count', { values: { count: album.assetCount } })}
        </p>
      {/if}

      {#if (showOwner || album.shared) && showItemCount}
        <p>•</p>
      {/if}

      {#if showOwner}
        {@const owner = album.albumUsers[0].user}
        {#if owner.id === authManager.user.id}
          <p>{$t('owned')}</p>
        {:else}
          <p>
            {$t('shared_by_user', { values: { user: owner.name } })}
          </p>
        {/if}
      {:else if album.shared}
        <p>{$t('shared')}</p>
      {/if}
    </span>
  </div>
</div>
