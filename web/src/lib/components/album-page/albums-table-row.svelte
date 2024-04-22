<script lang="ts">
  import { goto } from '$app/navigation';
  import { AppRoute, dateFormats } from '$lib/constants';
  import type { AlbumResponseDto } from '@immich/sdk';
  import type { ContextMenuPosition } from '$lib/utils/context-menu';
  import { user } from '$lib/stores/user.store';
  import { locale } from '$lib/stores/preferences.store';
  import { mdiShareVariantOutline } from '@mdi/js';
  import Icon from '$lib/components/elements/icon.svelte';

  export let album: AlbumResponseDto;
  export let onShowContextMenu: ((position: ContextMenuPosition, album: AlbumResponseDto) => unknown) | undefined =
    undefined;

  const showContextMenu = (position: ContextMenuPosition) => {
    onShowContextMenu?.(position, album);
  };

  const dateLocaleString = (dateString: string) => {
    return new Date(dateString).toLocaleDateString($locale, dateFormats.album);
  };
</script>

<tr
  class="flex h-[50px] w-full place-items-center border-[3px] border-transparent p-2 text-center odd:bg-immich-gray even:bg-immich-bg hover:cursor-pointer hover:border-immich-primary/75 odd:dark:bg-immich-dark-gray/75 even:dark:bg-immich-dark-gray/50 dark:hover:border-immich-dark-primary/75 md:p-5"
  on:click={() => goto(`${AppRoute.ALBUMS}/${album.id}`)}
  on:contextmenu|preventDefault={(e) => showContextMenu({ x: e.x, y: e.y })}
>
  <td class="text-md text-left w-full sm:w-[60%] md:w-[42%] xl:w-[30%] 2xl:w-[40%] items-center">
    {#if album.shared}
      <div class="flex">
        <p class="line-clamp-1 pr-1">{album.albumName}</p>
        <p>
          <Icon
            path={mdiShareVariantOutline}
            size="16"
            class="inline ml-1 opacity-70"
            title={album.ownerId === $user.id ? 'Shared by you' : `Shared by ${album.owner.name}`}
          />
        </p>
      </div>
    {:else}
      <p class="line-clamp-1">{album.albumName}</p>
    {/if}
  </td>
  <td class="text-md hidden text-ellipsis text-center md:block md:w-[18%] xl:w-[15%] 2xl:w-[12%]">
    {album.assetCount}
    {album.assetCount > 1 ? `items` : `item`}
  </td>
  <td class="text-md text-ellipsis text-center hidden xl:block xl:w-[15%] 2xl:w-[12%]">
    {dateLocaleString(album.updatedAt)}
  </td>
  <td class="text-md text-ellipsis text-center hidden xl:block xl:w-[15%] 2xl:w-[12%]">
    {dateLocaleString(album.createdAt)}
  </td>
  <td class="text-md hidden text-ellipsis text-center sm:block sm:w-[20%] xl:w-[15%] 2xl:w-[12%]">
    {#if album.endDate}
      {dateLocaleString(album.endDate)}
    {:else}
      -
    {/if}
  </td>
  <td class="text-md hidden text-ellipsis text-center sm:block sm:w-[20%] xl:w-[15%] 2xl:w-[12%]">
    {#if album.startDate}
      {dateLocaleString(album.startDate)}
    {:else}
      -
    {/if}
  </td>
</tr>
