<script lang="ts">
  import { type AlbumResponseDto, getAllAlbums } from '@immich/sdk';
  import { onMount } from 'svelte';
  import AlbumListItem from '../../asset-viewer/album-list-item.svelte';
  import NewAlbumListItem from './new-album-list-item.svelte';
  import { normalizeSearchString } from '$lib/utils/string-utils';
  import FullScreenModal from '$lib/components/shared-components/full-screen-modal.svelte';
  import { initInput } from '$lib/actions/focus';
  import { t } from 'svelte-i18n';
  import { sortAlbums } from '$lib/utils/album-utils';
  import { albumViewSettings } from '$lib/stores/preferences.store';
  import {
    type AlbumModalRow,
    AlbumModalRowType,
    isSelectableRowType,
  } from '$lib/components/shared-components/add-album-modal/album-modal';

  let albums: AlbumResponseDto[] = $state([]);
  let recentAlbums: AlbumResponseDto[] = $state([]);
  let loading = $state(true);
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
    albums = await getAllAlbums({ shared: shared || undefined });
    recentAlbums = albums.sort((a, b) => (new Date(a.createdAt) > new Date(b.createdAt) ? -1 : 1)).slice(0, 3);
    loading = false;
  });

  const albumModalRows = $derived.by(() => {
    // only show recent albums if no search was entered or we're in the normal albums (non-shared) modal.
    const recentAlbumsToShow = !shared && search.length === 0 ? recentAlbums : [];
    const rows: AlbumModalRow[] = [];
    rows.push({ type: AlbumModalRowType.NEW_ALBUM, selected: selectedRowIndex === 0 });

    const filteredAlbums = sortAlbums(
      search.length > 0 && albums.length > 0
        ? albums.filter((album) => {
          return normalizeSearchString(album.albumName).includes(normalizeSearchString(search));
        })
        : albums,
      { sortBy: $albumViewSettings.sortBy, orderBy: $albumViewSettings.sortOrder },
    );

    if (filteredAlbums.length > 0) {
      if (recentAlbumsToShow.length > 0) {
        rows.push({ type: AlbumModalRowType.SECTION, text: $t('recent').toUpperCase() });
        const selectedOffsetDueToNewAlbumRow = 1;
        for (const [i, album] of recentAlbums.entries()) {
          rows.push({
            type: AlbumModalRowType.ALBUM_ITEM,
            selected: selectedRowIndex === i + selectedOffsetDueToNewAlbumRow,
            album,
          });
        }
      }

      if (!shared) {
        rows.push({
          type: AlbumModalRowType.SECTION,
          text: (search.length === 0 ? $t('all_albums') : $t('albums')).toUpperCase(),
        });
      }

      const selectedOffsetDueToNewAndRecents = 1 + recentAlbumsToShow.length;
      for (const [i, album] of filteredAlbums.entries()) {
        rows.push({
          type: AlbumModalRowType.ALBUM_ITEM,
          selected: selectedRowIndex === i + selectedOffsetDueToNewAndRecents,
          album,
        });
      }
    } else if (albums.length > 0) {
      rows.push({ type: AlbumModalRowType.MESSAGE, text: $t('no_albums_with_name_yet') });
    } else {
      rows.push({ type: AlbumModalRowType.MESSAGE, text: $t('no_albums_yet') });
    }
    return rows;
  });
  const selectableRowCount = $derived(albumModalRows.filter((row) => isSelectableRowType(row.type)).length);

  const onkeydown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (selectedRowIndex > 0) {
        selectedRowIndex--;
      } else {
        selectedRowIndex = selectableRowCount - 1;
      }
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (selectedRowIndex < selectableRowCount - 1) {
        selectedRowIndex++;
      } else {
        selectedRowIndex = 0;
      }
    }
    if (e.key === 'Enter') {
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
    }

    if (e.key !== 'Enter' && e.key !== 'ArrowUp' && e.key !== 'ArrowDown') {
      selectedRowIndex = -1;
    }
  };

  const handleAlbumClick = (album: AlbumResponseDto) => () => onAlbumClick(album);
</script>

<FullScreenModal title={shared ? $t('add_to_shared_album') : $t('add_to_album')} {onClose}>
  <div class="mb-2 flex max-h-[400px] flex-col">
    {#if loading}
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
        class="border-b-4 border-immich-bg bg-immich-bg px-6 py-2 text-2xl focus:border-immich-primary dark:border-immich-dark-gray dark:bg-immich-dark-gray dark:focus:border-immich-dark-primary"
        placeholder={$t('search')}
        {onkeydown}
        bind:value={search}
        use:initInput
      />
      <div class="immich-scrollbar overflow-y-auto">
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
