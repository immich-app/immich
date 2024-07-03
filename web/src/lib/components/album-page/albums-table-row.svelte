<script lang="ts">
  import { goto } from '$app/navigation';
  import { AppRoute, dateFormats } from '$lib/constants';
  import type { AlbumResponseDto } from '@immich/sdk';
  import type { ContextMenuPosition } from '$lib/utils/context-menu';
  import { user } from '$lib/stores/user.store';
  import { locale } from '$lib/stores/preferences.store';
  import { mdiShareVariantOutline } from '@mdi/js';
  import Icon from '$lib/components/elements/icon.svelte';
  import { t } from 'svelte-i18n';

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
  <td class="text-md text-ellipsis text-left w-8/12 sm:w-4/12 md:w-4/12 xl:w-[30%] 2xl:w-[40%] items-center">
    {album.albumName}
    {#if album.shared}
      <Icon
        path={mdiShareVariantOutline}
        size="16"
        class="inline ml-1 opacity-70"
        title={album.ownerId === $user.id
          ? $t('shared_by_you')
          : $t('shared_by_user', { values: { user: album.owner.name } })}
      />
    {/if}
  </td>
  <td class="text-md text-ellipsis text-center sm:w-2/12 md:w-2/12 xl:w-[15%] 2xl:w-[12%]">
    {album.assetCount}
    {album.assetCount > 1 ? `items` : `item`}
  </td>
  <td class="text-md hidden text-ellipsis text-center sm:block w-3/12 xl:w-[15%] 2xl:w-[12%]">
    {dateLocaleString(album.updatedAt)}
  </td>
  <td class="text-md hidden text-ellipsis text-center sm:block w-3/12 xl:w-[15%] 2xl:w-[12%]">
    {dateLocaleString(album.createdAt)}
  </td>
  <td class="text-md text-ellipsis text-center hidden xl:block xl:w-[15%] 2xl:w-[12%]">
    {#if album.endDate}
      {dateLocaleString(album.endDate)}
    {:else}
      -
    {/if}
  </td>
  <td class="text-md text-ellipsis text-center hidden xl:block xl:w-[15%] 2xl:w-[12%]">
    {#if album.startDate}
      {dateLocaleString(album.startDate)}
    {:else}
      -
    {/if}
  </td>
</tr>
