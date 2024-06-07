<script lang="ts">
  import { slide } from 'svelte/transition';
  import type { AlbumResponseDto } from '@immich/sdk';
  import { AlbumGroupBy, albumViewSettings } from '$lib/stores/preferences.store';
  import type { ContextMenuPosition } from '$lib/utils/context-menu';
  import { mdiChevronRight } from '@mdi/js';
  import AlbumTableHeader from '$lib/components/album-page/albums-table-header.svelte';
  import AlbumTableRow from '$lib/components/album-page/albums-table-row.svelte';
  import Icon from '$lib/components/elements/icon.svelte';
  import {
    isAlbumGroupCollapsed,
    toggleAlbumGroupCollapsing,
    sortOptionsMetadata,
    type AlbumGroup,
  } from '$lib/utils/album-utils';

  export let groupedAlbums: AlbumGroup[];
  export let albumGroupOption: string = AlbumGroupBy.None;
  export let onShowContextMenu: ((position: ContextMenuPosition, album: AlbumResponseDto) => unknown) | undefined =
    undefined;
</script>

<table class="mt-2 w-full text-left">
  <thead
    class="mb-4 flex h-12 w-full rounded-md border bg-gray-50 text-immich-primary dark:border-immich-dark-gray dark:bg-immich-dark-gray dark:text-immich-dark-primary"
  >
    <tr class="flex w-full place-items-center p-2 md:p-5">
      {#each sortOptionsMetadata as option, index (index)}
        <AlbumTableHeader {option} />
      {/each}
    </tr>
  </thead>
  {#if albumGroupOption === AlbumGroupBy.None}
    <tbody class="block w-full overflow-y-auto rounded-md border dark:border-immich-dark-gray dark:text-immich-dark-fg">
      {#each groupedAlbums[0].albums as album (album.id)}
        <AlbumTableRow {album} {onShowContextMenu} />
      {/each}
    </tbody>
  {:else}
    {#each groupedAlbums as albumGroup (albumGroup.id)}
      {@const isCollapsed = isAlbumGroupCollapsed($albumViewSettings, albumGroup.id)}
      {@const iconRotation = isCollapsed ? 'rotate-0' : 'rotate-90'}
      <button
        type="button"
        on:click={() => toggleAlbumGroupCollapsing(albumGroup.id)}
        class="flex w-full mt-4 rounded-md"
        aria-expanded={!isCollapsed}
      >
        <tbody
          class="block w-full overflow-y-auto rounded-md border dark:border-immich-dark-gray dark:text-immich-dark-fg"
        >
          <tr class="flex w-full place-items-center p-2 md:pl-5 md:pr-5 md:pt-3 md:pb-3">
            <td class="text-md text-left -mb-1">
              <Icon
                path={mdiChevronRight}
                size="20"
                class="inline-block -mt-2 transition-all duration-[250ms] {iconRotation}"
              />
              <span class="font-bold text-2xl">{albumGroup.name}</span>
              <span class="ml-1.5">
                ({albumGroup.albums.length}
                {albumGroup.albums.length > 1 ? 'albums' : 'album'})
              </span>
            </td>
          </tr>
        </tbody>
      </button>
      {#if !isCollapsed}
        <tbody
          class="block w-full overflow-y-auto rounded-md border dark:border-immich-dark-gray dark:text-immich-dark-fg mt-4"
          transition:slide={{ duration: 300 }}
        >
          {#each albumGroup.albums as album (album.id)}
            <AlbumTableRow {album} {onShowContextMenu} />
          {/each}
        </tbody>
      {/if}
    {/each}
  {/if}
</table>
