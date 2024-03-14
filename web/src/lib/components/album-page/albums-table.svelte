<script lang="ts">
  import { AppRoute } from '$lib/constants';
  import type { AlbumResponseDto } from '@immich/sdk';
  import TableHeader from '$lib/components/album-page/albums-table-header.svelte';
  import { goto } from '$app/navigation';
  import Icon from '$lib/components/elements/icon.svelte';
  import { mdiPencilOutline, mdiTrashCanOutline } from '@mdi/js';
  import type { Sort } from '$lib/components/album-page/albums-list.svelte';
  import { locale } from '$lib/stores/preferences.store';
  import { dateFormats } from '$lib/constants';

  export let albumsFiltered: AlbumResponseDto[];
  export let sortByOptions: Sort[];
  export let onChooseAlbumToDelete: (album: AlbumResponseDto) => void;
  export let onAlbumToEdit: (album: AlbumResponseDto) => void;

  const dateLocaleString = (dateString: string) => {
    return new Date(dateString).toLocaleDateString($locale, dateFormats.album);
  };
</script>

<table class="mt-2 w-full text-left">
  <thead
    class="mb-4 flex h-12 w-full rounded-md border bg-gray-50 text-immich-primary dark:border-immich-dark-gray dark:bg-immich-dark-gray dark:text-immich-dark-primary"
  >
    <tr class="flex w-full place-items-center p-2 md:p-5">
      {#each sortByOptions as option, index (index)}
        <TableHeader {option} />
      {/each}
      <th class="hidden text-center text-sm font-medium 2xl:block 2xl:w-[12%]">Action</th>
    </tr>
  </thead>
  <tbody class="block w-full overflow-y-auto rounded-md border dark:border-immich-dark-gray dark:text-immich-dark-fg">
    {#each albumsFiltered as album (album.id)}
      <tr
        class="flex h-[50px] w-full place-items-center border-[3px] border-transparent p-2 text-center odd:bg-immich-gray even:bg-immich-bg hover:cursor-pointer hover:border-immich-primary/75 odd:dark:bg-immich-dark-gray/75 even:dark:bg-immich-dark-gray/50 dark:hover:border-immich-dark-primary/75 md:p-5"
        on:click={() => goto(`${AppRoute.ALBUMS}/${album.id}`)}
        on:keydown={(event) => event.key === 'Enter' && goto(`${AppRoute.ALBUMS}/${album.id}`)}
        tabindex="0"
      >
        <a data-sveltekit-preload-data="hover" class="flex w-full" href="{AppRoute.ALBUMS}/{album.id}">
          <td class="text-md text-ellipsis text-left w-8/12 sm:w-4/12 md:w-4/12 xl:w-[30%] 2xl:w-[40%]"
            >{album.albumName}</td
          >
          <td class="text-md text-ellipsis text-center sm:w-2/12 md:w-2/12 xl:w-[15%] 2xl:w-[12%]">
            {album.assetCount}
            {album.assetCount > 1 ? `items` : `item`}
          </td>
          <td class="text-md hidden text-ellipsis text-center sm:block w-3/12 xl:w-[15%] 2xl:w-[12%]"
            >{dateLocaleString(album.updatedAt)}
          </td>
          <td class="text-md hidden text-ellipsis text-center sm:block w-3/12 xl:w-[15%] 2xl:w-[12%]"
            >{dateLocaleString(album.createdAt)}</td
          >
          <td class="text-md text-ellipsis text-center hidden xl:block xl:w-[15%] 2xl:w-[12%]">
            {#if album.endDate}
              {dateLocaleString(album.endDate)}
            {:else}
              &#10060;
            {/if}</td
          >
          <td class="text-md text-ellipsis text-center hidden xl:block xl:w-[15%] 2xl:w-[12%]"
            >{#if album.startDate}
              {dateLocaleString(album.startDate)}
            {:else}
              &#10060;
            {/if}</td
          >
        </a>
        <td class="text-md hidden text-ellipsis text-center 2xl:block xl:w-[15%] 2xl:w-[12%]">
          <button
            on:click|stopPropagation={() => onAlbumToEdit(album)}
            class="rounded-full z-1 bg-immich-primary p-3 text-gray-100 transition-all duration-150 hover:bg-immich-primary/75 dark:bg-immich-dark-primary dark:text-gray-700"
          >
            <Icon path={mdiPencilOutline} size="16" />
          </button>
          <button
            on:click|stopPropagation={() => onChooseAlbumToDelete(album)}
            class="rounded-full z-1 bg-immich-primary p-3 text-gray-100 transition-all duration-150 hover:bg-immich-primary/75 dark:bg-immich-dark-primary dark:text-gray-700"
          >
            <Icon path={mdiTrashCanOutline} size="16" />
          </button>
        </td>
      </tr>
    {/each}
  </tbody>
</table>
