<script lang="ts">
  import Icon from '$lib/components/elements/icon.svelte';
  import { locale } from '$lib/stores/preferences.store';
  import { user } from '$lib/stores/user.store';
  import { getAssetThumbnailUrl } from '$lib/utils';
  import { ThumbnailFormat, getAssetThumbnail, getUserById, type AlbumResponseDto } from '@immich/sdk';
  import { mdiDotsVertical } from '@mdi/js';
  import { onMount } from 'svelte';
  import { getContextMenuPosition, type ContextMenuPosition } from '../../utils/context-menu';
  import IconButton from '../elements/buttons/icon-button.svelte';

  export let album: AlbumResponseDto;
  export let isSharingView = false;
  export let showItemCount = true;
  export let preload = false;
  export let onShowContextMenu: ((position: ContextMenuPosition) => void) | undefined = undefined;

  $: imageData = album.albumThumbnailAssetId
    ? getAssetThumbnailUrl(album.albumThumbnailAssetId, ThumbnailFormat.Webp)
    : null;

  const loadHighQualityThumbnail = async (assetId: string | null) => {
    if (!assetId) {
      return;
    }

    const data = await getAssetThumbnail({ id: assetId, format: ThumbnailFormat.Jpeg });
    return URL.createObjectURL(data);
  };

  const showAlbumContextMenu = (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onShowContextMenu?.(getContextMenuPosition(e));
  };

  onMount(async () => {
    imageData = (await loadHighQualityThumbnail(album.albumThumbnailAssetId)) || null;
  });

  const getAlbumOwnerInfo = () => getUserById({ id: album.ownerId });
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
      <IconButton color="transparent-primary" title="Show album options" on:click={showAlbumContextMenu}>
        <Icon path={mdiDotsVertical} size="20" class="icon-white-drop-shadow text-white" />
      </IconButton>
    </div>
  {/if}

  <div class={`relative aspect-square`}>
    {#if album.albumThumbnailAssetId}
      <img
        loading={preload ? 'eager' : 'lazy'}
        src={imageData}
        alt={album.albumName}
        class="z-0 h-full w-full rounded-xl object-cover transition-all duration-300 hover:shadow-lg"
        data-testid="album-image"
        draggable="false"
      />
    {:else}
      <enhanced:img
        loading={preload ? 'eager' : 'lazy'}
        src="$lib/assets/no-thumbnail.png"
        sizes="min(271px,186px)"
        alt={album.albumName}
        class="z-0 h-full w-full rounded-xl object-cover transition-all duration-300 hover:shadow-lg"
        data-testid="album-image"
        draggable="false"
      />
    {/if}
  </div>

  <div class="mt-4">
    <p
      class="w-full truncate text-lg font-semibold text-black dark:text-white group-hover:text-immich-primary dark:group-hover:text-immich-dark-primary"
      data-testid="album-name"
      title={album.albumName}
    >
      {album.albumName}
    </p>

    <span class="flex gap-2 text-sm dark:text-immich-dark-fg" data-testid="album-details">
      {#if showItemCount}
        <p>
          {album.assetCount.toLocaleString($locale)}
          {album.assetCount == 1 ? `item` : `items`}
        </p>
      {/if}

      {#if isSharingView || album.shared}
        <p>·</p>
      {/if}

      {#if isSharingView}
        {#await getAlbumOwnerInfo() then albumOwner}
          {#if $user.email == albumOwner.email}
            <p>Owned</p>
          {:else}
            <p>
              Shared by {albumOwner.name}
            </p>
          {/if}
        {/await}
      {:else if album.shared}
        <p>Shared</p>
      {/if}
    </span>
  </div>
</div>
