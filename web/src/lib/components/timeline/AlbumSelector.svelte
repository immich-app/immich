<script lang="ts">
  import { getAllAlbums, type AlbumResponseDto } from '@immich/sdk';
  import { t } from 'svelte-i18n';
  import { onMount } from 'svelte';
  import { user } from '$lib/stores/user.store';

  interface Props {
    selectedIds?: string[];
  }

  let { selectedIds = $bindable([]) }: Props = $props();

  let sharedAlbums: AlbumResponseDto[] = $state([]);
  let loading = $state(true);
  let error = $state<string | null>(null);

  async function loadSharedAlbums() {
    try {
      loading = true;
      error = null;
      const allSharedAlbums = await getAllAlbums({ shared: true });
      // Filter out albums owned by the current user - those are already shown in timeline
      sharedAlbums = allSharedAlbums.filter((album) => album.ownerId !== $user?.id);
    } catch (e) {
      console.error('Failed to load shared albums:', e);
      error = 'Failed to load shared albums';
    } finally {
      loading = false;
    }
  }

  function toggleAlbum(albumId: string) {
    if (selectedIds.includes(albumId)) {
      selectedIds = selectedIds.filter((id) => id !== albumId);
    } else {
      selectedIds = [...selectedIds, albumId];
    }
  }

  function selectAll() {
    selectedIds = sharedAlbums.map((a) => a.id);
  }

  function clearAll() {
    selectedIds = [];
  }

  onMount(() => {
    loadSharedAlbums();
  });
</script>

<div class="space-y-2">
  {#if loading}
    <p class="text-sm text-gray-500 dark:text-gray-400">{$t('loading')}</p>
  {:else if error}
    <p class="text-sm text-red-500">{error}</p>
  {:else if sharedAlbums.length === 0}
    <p class="text-sm text-gray-500 dark:text-gray-400">{$t('no_albums_shared_with_you')}</p>
  {:else}
    <div class="flex justify-between items-center mb-2">
      <span class="text-sm font-medium">
        {selectedIds.length} of {sharedAlbums.length} selected
      </span>
      <div class="flex gap-2">
        <button
          type="button"
          onclick={selectAll}
          class="text-xs text-immich-primary dark:text-immich-dark-primary hover:underline"
        >
          {$t('select_all')}
        </button>
        <button
          type="button"
          onclick={clearAll}
          class="text-xs text-immich-primary dark:text-immich-dark-primary hover:underline"
        >
          {$t('clear_all')}
        </button>
      </div>
    </div>

    <div class="max-h-64 overflow-y-auto space-y-1 border border-gray-200 dark:border-gray-700 rounded-lg p-2">
      {#each sharedAlbums as album}
        <label
          class="flex items-start gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-pointer transition-colors"
        >
          <input
            type="checkbox"
            checked={selectedIds.includes(album.id)}
            onchange={() => toggleAlbum(album.id)}
            class="mt-1 h-4 w-4 rounded border-gray-300 text-immich-primary focus:ring-immich-primary dark:border-gray-600 dark:bg-gray-700"
          />
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {album.albumName}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              {$t('shared_by')} {album.owner.name} · {album.assetCount}
              {album.assetCount === 1 ? $t('item') : $t('items')}
            </p>
          </div>
        </label>
      {/each}
    </div>
  {/if}
</div>
