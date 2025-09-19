<script lang="ts">
  import AlbumTableHeader from '$lib/components/album-page/albums-table-header.svelte';
  import AlbumTableRow from '$lib/components/album-page/albums-table-row.svelte';
  import { AlbumGroupBy, albumViewSettings } from '$lib/stores/preferences.store';
  import {
    isAlbumGroupCollapsed,
    sortOptionsMetadata,
    toggleAlbumGroupCollapsing,
    type AlbumGroup,
  } from '$lib/utils/album-utils';
  import type { ContextMenuPosition } from '$lib/utils/context-menu';
  import type { AlbumResponseDto } from '@immich/sdk';
  import { Icon } from '@immich/ui';
  import { mdiChevronRight } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import { slide } from 'svelte/transition';

  interface Props {
    groupedAlbums: AlbumGroup[];
    albumGroupOption?: string;
    onShowContextMenu?: ((position: ContextMenuPosition, album: AlbumResponseDto) => unknown) | undefined;
  }

  let { groupedAlbums, albumGroupOption = AlbumGroupBy.None, onShowContextMenu }: Props = $props();
</script>

<table class="mt-2 w-full text-start">
  <thead
    class="mb-4 flex h-12 w-full rounded-md border bg-gray-50 text-primary dark:border-immich-dark-gray dark:bg-immich-dark-gray"
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
      <tbody
        class="block w-full overflow-y-auto rounded-md border dark:border-immich-dark-gray dark:text-immich-dark-fg mt-4"
      >
        <tr
          class="flex w-full place-items-center p-2 md:ps-5 md:pe-5 md:pt-3 md:pb-3"
          onclick={() => toggleAlbumGroupCollapsing(albumGroup.id)}
          aria-expanded={!isCollapsed}
        >
          <td class="text-md text-start -mb-1">
            <Icon
              icon={mdiChevronRight}
              size="20"
              class="inline-block -mt-2 transition-all duration-250 {iconRotation}"
            />
            <span class="font-bold text-2xl">{albumGroup.name}</span>
            <span class="ms-1.5">
              ({$t('albums_count', { values: { count: albumGroup.albums.length } })})
            </span>
          </td>
        </tr>
      </tbody>
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
