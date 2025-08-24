<script lang="ts">
  import { initInput } from '$lib/actions/focus';
  import {
    AlbumModalRowConverter,
    AlbumModalRowType,
    isSelectableRowType,
  } from '$lib/components/shared-components/album-selection/album-selection-utils';
  import { albumViewSettings } from '$lib/stores/preferences.store';
  import { createAlbum, getAllAlbums, type AlbumResponseDto } from '@immich/sdk';
  import { Button, Modal, ModalBody } from '@immich/ui';
  import { onMount } from 'svelte';
  import { t } from 'svelte-i18n';
  import AlbumListItem from '../components/asset-viewer/album-list-item.svelte';
  import NewAlbumListItem from '../components/shared-components/album-selection/new-album-list-item.svelte';

  let albums: AlbumResponseDto[] = $state([]);
  let recentAlbums: AlbumResponseDto[] = $state([]);
  let loading = $state(true);
  let search = $state('');
  let selectedRowIndex: number = $state(-1);

  interface Props {
    shared: boolean;
    onClose: (albums?: AlbumResponseDto[]) => void;
  }

  let { shared, onClose }: Props = $props();

  onMount(async () => {
    albums = await getAllAlbums({ shared: shared || undefined });
    recentAlbums = albums.sort((a, b) => (new Date(a.updatedAt) > new Date(b.updatedAt) ? -1 : 1)).slice(0, 3);
    loading = false;
  });

  const multiSelectedAlbumIds: string[] = $state([]);
  const multiSelectActive = $derived(multiSelectedAlbumIds.length > 0);

  const rowConverter = new AlbumModalRowConverter(shared, $albumViewSettings.sortBy, $albumViewSettings.sortOrder);
  const albumModalRows = $derived(
    rowConverter.toModalRows(search, recentAlbums, albums, selectedRowIndex, multiSelectedAlbumIds),
  );
  const selectableRowCount = $derived(albumModalRows.filter((row) => isSelectableRowType(row.type)).length);

  const onNewAlbum = async (name: string) => {
    const album = await createAlbum({ createAlbumDto: { albumName: name } });
    onClose([album]);
  };

  const handleAlbumClick = (album?: AlbumResponseDto) => {
    if (multiSelectActive) {
      handleMultiSelect(album);
      return;
    }
    if (album) {
      onClose([album]);
      return;
    }
    onClose();
  };

  const handleMultiSelect = (album?: AlbumResponseDto) => {
    const selectedAlbum = album ?? albumModalRows.find(({ selected }) => selected)?.album;

    if (!selectedAlbum) {
      return;
    }

    const index = multiSelectedAlbumIds.indexOf(selectedAlbum.id);
    if (index === -1) {
      multiSelectedAlbumIds.push(selectedAlbum.id);
      return;
    }
    multiSelectedAlbumIds.splice(index, 1);
  };

  const handleMultiSubmit = () => {
    const albums = new Set(albumModalRows.filter((row) => row.multiSelected).map(({ album }) => album!));
    if (albums.size > 0) {
      onClose([...albums]);
    } else {
      onClose();
    }
  };

  const onEnter = async () => {
    const item = albumModalRows.find(({ selected }) => selected);
    if (!item) {
      return;
    }

    switch (item.type) {
      case AlbumModalRowType.NEW_ALBUM: {
        await onNewAlbum(search);
        break;
      }
      case AlbumModalRowType.ALBUM_ITEM: {
        if (multiSelectActive) {
          handleMultiSubmit();
          break;
        }
        if (item.album) {
          onClose([item.album]);
        }
        break;
      }
    }

    selectedRowIndex = -1;
  };

  const onkeydown = async (e: KeyboardEvent) => {
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
        await onEnter();
        break;
      }
      case 'm': {
        e.preventDefault();
        handleMultiSelect();
        break;
      }
      default: {
        selectedRowIndex = -1;
      }
    }
  };
</script>

<Modal title={shared ? $t('add_to_shared_album') : $t('add_to_album')} {onClose} size="small">
  <ModalBody>
    <div class="mb-2 flex max-h-[400px] flex-col">
      {#if loading}
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
                multiSelected={row.multiSelected}
                searchQuery={search}
                onAlbumClick={() => handleAlbumClick(row.album)}
                onMultiSelect={() => handleMultiSelect(row.album)}
              />
            {/if}
          {/each}
        </div>
      {/if}
    </div>
    {#if multiSelectActive}
      <Button size="small" shape="round" fullWidth onclick={handleMultiSubmit}
        >{$t('add_to_albums_count', { values: { count: multiSelectedAlbumIds.length } })}</Button
      >
    {/if}
  </ModalBody>
</Modal>
