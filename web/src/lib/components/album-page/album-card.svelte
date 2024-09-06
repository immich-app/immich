<script lang="ts">
  import { user } from '$lib/stores/user.store';
  import type { AlbumResponseDto } from '@immich/sdk';
  import { mdiDotsVertical } from '@mdi/js';
  import { getContextMenuPositionFromEvent, type ContextMenuPosition } from '$lib/utils/context-menu';
  import { getShortDateRange } from '$lib/utils/date-time';
  import AlbumCover from '$lib/components/album-page/album-cover.svelte';
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import { t } from 'svelte-i18n';

  export let album: AlbumResponseDto;
  export let showOwner = false;
  export let showDateRange = false;
  export let showItemCount = false;
  export let preload = false;
  export let onShowContextMenu: ((position: ContextMenuPosition) => unknown) | undefined = undefined;

  const showAlbumContextMenu = (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onShowContextMenu?.(getContextMenuPositionFromEvent(e));
  };
</script>

<div
  class="group relative rounded-2xl border border-transparent p-5 hover:bg-gray-100 hover:border-gray-200 dark:hover:border-gray-800 dark:hover:bg-gray-900"
  data-testid="album-card"
>
  {#if onShowContextMenu}
    <div
      id="icon-{album.id}"
      class="absolute right-6 top-6 z-10 opacity-0 group-hover:opacity-100 focus-within:opacity-100"
      data-testid="context-button-parent"
    >
      <CircleIconButton
        color="opaque"
        title={$t('show_album_options')}
        icon={mdiDotsVertical}
        size="20"
        padding="2"
        class="icon-white-drop-shadow"
        on:click={showAlbumContextMenu}
      />
    </div>
  {/if}

  <AlbumCover {album} {preload} class="transition-all duration-300 hover:shadow-lg" />

  <div class="mt-4">
    <p
      class="w-full leading-6 text-lg line-clamp-2 font-semibold text-black dark:text-white group-hover:text-immich-primary dark:group-hover:text-immich-dark-primary"
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
        {#if $user.id === album.ownerId}
          <p>{$t('owned')}</p>
        {:else if album.owner}
          <p>{$t('shared_by_user', { values: { user: album.owner.name } })}</p>
        {:else}
          <p>{$t('shared')}</p>
        {/if}
      {:else if album.shared}
        <p>{$t('shared')}</p>
      {/if}
    </span>
  </div>
</div>
