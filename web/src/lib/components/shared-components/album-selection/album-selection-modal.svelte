<script lang="ts">
  import { initInput } from '$lib/actions/focus';
  import {
    AlbumModalRowConverter,
    AlbumModalRowType,
    isSelectableRowType,
  } from '$lib/components/shared-components/album-selection/album-selection-utils';
  import FullScreenModal from '$lib/components/shared-components/full-screen-modal.svelte';
  import { albumViewSettings } from '$lib/stores/preferences.store';
  import { type AlbumResponseDto, getAllAlbums } from '@immich/sdk';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import AlbumListItem from '../../asset-viewer/album-list-item.svelte';
  import NewAlbumListItem from './new-album-list-item.svelte';
  import { albumListingStore } from '$lib/stores/album-listing.store';

  let { ensureLoaded: albumsEnsureLoaded, albums, isLoading } = albumListingStore;
  let recentAlbums: AlbumResponseDto[] = $derived(
    albums.sort((a, b) => (new Date(a.createdAt) > new Date(b.createdAt) ? -1 : 1)).slice(0, 3),
  );

  let search = $state('');
  let selectedRowIndex: number = $state(-1);

  interface Props {
    onNewAlbum: (search: string) => void;
    onAlbumClick: (album: AlbumResponseDto) => void;
    shared: boolean;
    onClose: () => void;
  }

  let { onNewAlbum, onAlbumClick, shared, onClose }: Props = $props();

  onMount(async () => {
    await albumsEnsureLoaded();
  });

  const rowConverter = new AlbumModalRowConverter(shared, $albumViewSettings.sortBy, $albumViewSettings.sortOrder);
  const albumModalRows = $derived(rowConverter.toModalRows(search, recentAlbums, albums, selectedRowIndex));
  const selectableRowCount = $derived(albumModalRows.filter((row) => isSelectableRowType(row.type)).length);

  const onkeydown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowUp': {
        e.preventDefault();
        if (selectedRowIndex > 0) {
          selectedRowIndex--;
        } else {
          selectedRowIndex = selectableRowCount - 1;
        }
        break;
      }
      case 'ArrowDown': {
        e.preventDefault();
        if (selectedRowIndex < selectableRowCount - 1) {
          selectedRowIndex++;
        } else {
          selectedRowIndex = 0;
        }
        break;
      }
      case 'Enter': {
        e.preventDefault();
        const selectedRow = albumModalRows.find((row) => row.selected);
        if (selectedRow) {
          if (selectedRow.type === AlbumModalRowType.NEW_ALBUM) {
            onNewAlbum(search);
          } else if (selectedRow.type === AlbumModalRowType.ALBUM_ITEM && selectedRow.album) {
            onAlbumClick(selectedRow.album);
          }
          selectedRowIndex = -1;
        }
        break;
      }
      default: {
        selectedRowIndex = -1;
      }
    }
  };

  const handleAlbumClick = (album: AlbumResponseDto) => () => onAlbumClick(album);
</script>

<FullScreenModal title={shared ? $t('add_to_shared_album') : $t('add_to_album')} {onClose}>
  <div class="mb-2 flex max-h-[400px] flex-col">
    {#if isLoading}
      <!-- eslint-disable-next-line svelte/require-each-key -->
      {#each { length: 3 } as _}
        <div class="flex animate-pulse gap-4 px-6 py-2">
          <div class="h-12 w-12 rounded-xl bg-slate-200"></div>
          <div class="flex flex-col items-start justify-center gap-2">
            <span class="h-4 w-36 animate-pulse bg-slate-200"></span>
            <div class="flex animate-pulse gap-1">
              <span class="h-3 w-8 bg-slate-200"></span>
              <span class="h-3 w-20 bg-slate-200"></span>
            </div>
          </div>
        </div>
      {/each}
    {:else}
      <input
        class="border-b-4 border-immich-bg px-6 py-2 text-2xl focus:border-immich-primary dark:border-immich-dark-gray dark:focus:border-immich-dark-primary"
        placeholder={$t('search')}
        {onkeydown}
        bind:value={search}
        use:initInput
      />
      <div class="immich-scrollbar overflow-y-auto">
        <!-- eslint-disable-next-line svelte/require-each-key -->
        {#each albumModalRows as row}
          {#if row.type === AlbumModalRowType.NEW_ALBUM}
            <NewAlbumListItem selected={row.selected || false} {onNewAlbum} searchQuery={search} />
          {:else if row.type === AlbumModalRowType.SECTION}
            <p class="px-5 py-3 text-xs">{row.text}</p>
          {:else if row.type === AlbumModalRowType.MESSAGE}
            <p class="px-5 py-1 text-sm">{row.text}</p>
          {:else if row.type === AlbumModalRowType.ALBUM_ITEM && row.album}
            <AlbumListItem
              album={row.album}
              selected={row.selected || false}
              searchQuery={search}
              onAlbumClick={handleAlbumClick(row.album)}
            />
          {/if}
        {/each}
      </div>
    {/if}
  </div>
</FullScreenModal>
