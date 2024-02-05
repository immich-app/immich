<script lang="ts">
  import noThumbnailUrl from '$lib/assets/no-thumbnail.png';
  import { locale } from '$lib/stores/preferences.store';
  import { type AlbumResponseDto, api, ThumbnailFormat, type UserResponseDto } from '@api';
  import { createEventDispatcher, onMount } from 'svelte';
  import IconButton from '../elements/buttons/icon-button.svelte';
  import Icon from '$lib/components/elements/icon.svelte';
  import type { OnClick, OnShowContextMenu } from './album-card';
  import { getContextMenuPosition } from '../../utils/context-menu';
  import { mdiDotsVertical } from '@mdi/js';
  import { user } from '$lib/stores/user.store';

  export let album: AlbumResponseDto;
  export let isSharingView = false;
  export let showItemCount = true;
  export let showContextMenu = true;
  export let preload = false;
  let showVerticalDots = false;

  $: imageData = album.albumThumbnailAssetId
    ? api.getAssetThumbnailUrl(album.albumThumbnailAssetId, ThumbnailFormat.Webp)
    : noThumbnailUrl;

  const dispatchClick = createEventDispatcher<OnClick>();
  const dispatchShowContextMenu = createEventDispatcher<OnShowContextMenu>();

  const loadHighQualityThumbnail = async (thubmnailId: string | null) => {
    if (thubmnailId == undefined) {
      return;
    }

    const { data } = await api.assetApi.getAssetThumbnail(
      {
        id: thubmnailId,
        format: ThumbnailFormat.Jpeg,
      },
      {
        responseType: 'blob',
      },
    );

    if (data instanceof Blob) {
      return URL.createObjectURL(data);
    }
  };

  const showAlbumContextMenu = (e: MouseEvent) =>
    dispatchShowContextMenu('showalbumcontextmenu', getContextMenuPosition(e));

  onMount(async () => {
    imageData = (await loadHighQualityThumbnail(album.albumThumbnailAssetId)) || noThumbnailUrl;
  });

  const getAlbumOwnerInfo = async (): Promise<UserResponseDto> => {
    const { data } = await api.userApi.getUserById({ id: album.ownerId });

    return data;
  };
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class="group relative mt-4 rounded-2xl border-[1px] border-transparent p-5 hover:cursor-pointer hover:bg-gray-100 hover:border-gray-200 dark:hover:border-gray-800 dark:hover:bg-gray-900"
  on:click={() => dispatchClick('click', album)}
  on:keydown={() => dispatchClick('click', album)}
  on:mouseenter={() => (showVerticalDots = true)}
  on:mouseleave={() => (showVerticalDots = false)}
  data-testid="album-card"
>
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  {#if showContextMenu}
    <div
      id={`icon-${album.id}`}
      class="absolute right-6 top-6 z-10"
      on:click|stopPropagation|preventDefault={showAlbumContextMenu}
      class:hidden={!showVerticalDots}
      data-testid="context-button-parent"
    >
      <IconButton color="transparent-primary">
        <Icon path={mdiDotsVertical} size="20" class="icon-white-drop-shadow text-white" />
      </IconButton>
    </div>
  {/if}

  <div class={`relative aspect-square`}>
    <img
      loading={preload ? 'eager' : 'lazy'}
      src={imageData}
      alt={album.id}
      class={`z-0 h-full w-full rounded-xl object-cover transition-all duration-300 hover:shadow-lg`}
      data-testid="album-image"
      draggable="false"
    />
    <div class="absolute top-0 h-full w-full rounded-3xl" />
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
