<script lang="ts">
  import { createAlbum } from '$lib/utils/album-utils';
  import { addAssetsToAlbum } from '$lib/utils/asset-utils';
  import { handleError } from '$lib/utils/handle-error';
  import type { OnAddToAlbum } from '$lib/utils/actions';
  import {
    AssetVisibility,
    getAllAlbums,
    removeAssetFromAlbum,
    type AlbumResponseDto,
  } from '@immich/sdk';
  import { Icon, toastManager } from '@immich/ui';
  import { mdiCheckBold, mdiLoading, mdiMinusThick, mdiPlus } from '@mdi/js';
  import { t } from 'svelte-i18n';

  type SelectableAsset = {
    id: string;
    visibility?: AssetVisibility;
  };

  interface Props {
    assets: SelectableAsset[];
    onAssetsAdded?: OnAddToAlbum;
    onAssetsRemoved?: OnAddToAlbum;
    onAlbumAddedDetail?: (payload: { assetIds: string[]; album: AlbumResponseDto }) => void;
    onAlbumRemovedDetail?: (payload: { assetIds: string[]; album: AlbumResponseDto }) => void;
  }

  let {
    assets,
    onAssetsAdded = () => {},
    onAssetsRemoved = () => {},
    onAlbumAddedDetail = undefined,
    onAlbumRemovedDetail = undefined,
  }: Props = $props();

  const selectionSize = $derived(assets.length);
  const assetIds = $derived(assets.map(({ id }) => id));
  const containsLockedAssets = $derived(assets.some(({ visibility }) => visibility === AssetVisibility.Locked));
  const disableAlbumToggles = $derived(selectionSize === 0 || containsLockedAssets);
  const hasSelection = $derived(selectionSize > 0);

  let loading = $state(false);
  let albums: AlbumResponseDto[] = $state([]);
  let membership: Record<string, number> = $state({});
  let search = $state('');
  let creatingAlbum = $state(false);
  let newAlbumName = $state('');
  let pending: Record<string, boolean> = $state({});
  let refreshToken = 0;

  const filteredAlbums = $derived(() => {
    if (!search) {
      return albums;
    }
    const normalized = search.toLowerCase();
    return albums.filter((album) => album.albumName.toLowerCase().includes(normalized));
  });

  const getMembershipState = (albumId: string) => {
    const count = membership[albumId] ?? 0;
    if (count <= 0) {
      return 'none' as const;
    }
    if (count >= selectionSize) {
      return 'all' as const;
    }
    return 'partial' as const;
  };

  const refreshAlbums = async () => {
    const token = ++refreshToken;

    if (!hasSelection) {
      albums = [];
      membership = {};
      return;
    }

    loading = true;
    try {
      const [allAlbums] = await Promise.all([getAllAlbums({})]);
      if (token !== refreshToken) {
        return;
      }
      albums = allAlbums.sort((a, b) => (new Date(a.updatedAt) > new Date(b.updatedAt) ? -1 : 1));

      const membershipMap: Record<string, number> = {};
      for (const assetId of assetIds) {
        const assetAlbums = await getAllAlbums({ assetId });
        for (const album of assetAlbums) {
          membershipMap[album.id] = (membershipMap[album.id] ?? 0) + 1;
        }
      }
      if (token === refreshToken) {
        membership = membershipMap;
      }
    } catch (error) {
      handleError(error, $t('errors.unable_to_load_albums'));
    } finally {
      if (token === refreshToken) {
        loading = false;
      }
    }
  };

    $effect(() => {
      assetIds;
      selectionSize;
      void refreshAlbums();
    });

  const toggleAlbum = async (album: AlbumResponseDto) => {
    if (disableAlbumToggles || pending[album.id]) {
      return;
    }

    pending = { ...pending, [album.id]: true };
    const state = getMembershipState(album.id);

    try {
      if (state === 'all') {
        const result = await removeAssetFromAlbum({ id: album.id, bulkIdsDto: { ids: assetIds } });
        const count = result.filter(({ success }) => success).length;
        toastManager.success($t('assets_removed_count', { values: { count } }));
        membership = { ...membership, [album.id]: 0 };
        onAssetsRemoved(assetIds, album.id);
        onAlbumRemovedDetail?.({ assetIds, album });
      } else {
        await addAssetsToAlbum(album.id, assetIds);
        membership = { ...membership, [album.id]: selectionSize };
        onAssetsAdded(assetIds, album.id);
        onAlbumAddedDetail?.({ assetIds, album });
      }
    } catch (error) {
      const message =
        state === 'all' ? $t('errors.error_removing_assets_from_album') : $t('errors.unable_to_add_to_album');
      handleError(error, message);
    } finally {
      pending = { ...pending, [album.id]: false };
    }
  };

  const handleCreateAlbum = async () => {
    if (creatingAlbum || !newAlbumName.trim()) {
      return;
    }

    creatingAlbum = true;
    try {
      const album = await createAlbum(newAlbumName.trim(), assetIds);
      if (album) {
        albums = [album, ...albums];
        membership = { ...membership, [album.id]: selectionSize };
        onAssetsAdded(assetIds, album.id);
        newAlbumName = '';
        creatingAlbum = false;
        return;
      }
    } finally {
      creatingAlbum = false;
    }
  };
</script>

<li class="px-4 pt-3 pb-1 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
  {$t('add_to')}
</li>

<li class="px-4">
  <input
    class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
    bind:value={search}
    placeholder={$t('search')}
    type="text"
  />
</li>

<li class="max-h-72 overflow-y-auto px-0">
  {#if loading}
    <ul>
      {#each { length: 3 } as _, index}
        <li class="flex items-center gap-3 px-4 py-3 text-sm text-gray-500 dark:text-gray-300" aria-busy="true">
          <span class="h-5 w-5 animate-pulse rounded-full bg-gray-300 dark:bg-gray-600"></span>
          <div class="flex-1">
            <div class="h-4 w-32 animate-pulse rounded bg-gray-300 dark:bg-gray-600"></div>
            <div class="mt-1 h-3 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
          </div>
        </li>
      {/each}
    </ul>
  {:else if !hasSelection}
    <ul>
      <li class="px-4 py-3 text-sm text-gray-500 dark:text-gray-300">
        {$t('add_to_menu_no_selection')}
      </li>
    </ul>
  {:else if containsLockedAssets}
    <ul>
      <li class="px-4 py-3 text-sm text-gray-500 dark:text-gray-300">
        {$t('add_to_menu_locked_assets_disabled')}
      </li>
    </ul>
  {:else if filteredAlbums.length === 0}
    <ul>
      <li class="px-4 py-3 text-sm text-gray-500 dark:text-gray-300">
        {$t('add_to_menu_no_albums')}
      </li>
    </ul>
  {:else}
    <ul>
      {#each filteredAlbums as album (album.id)}
        <li>
          <button
            class="flex w-full items-center gap-3 px-4 py-2 text-left text-sm font-medium text-immich-fg transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:text-immich-dark-fg dark:hover:bg-gray-700"
            onclick={() => toggleAlbum(album)}
            disabled={pending[album.id]}
            type="button"
          >
            <span
              class={[
                'flex h-5 w-5 items-center justify-center rounded border',
                getMembershipState(album.id) === 'all'
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-gray-400 text-gray-500 dark:border-gray-500',
              ]}
            >
              {#if getMembershipState(album.id) === 'all'}
                <Icon aria-hidden icon={mdiCheckBold} size="14" />
              {:else if getMembershipState(album.id) === 'partial'}
                <Icon aria-hidden icon={mdiMinusThick} size="14" />
              {/if}
            </span>
            <div class="flex flex-1 items-center justify-between gap-2 overflow-hidden">
              <p class="truncate">{album.albumName}</p>
              {#if selectionSize > 1 && membership[album.id] > 0}
                <span class="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-200">
                  {membership[album.id]}/{selectionSize}
                </span>
              {/if}
            </div>
            {#if pending[album.id]}
              <Icon aria-hidden icon={mdiLoading} size="16" class="animate-spin text-gray-500" />
            {/if}
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</li>

{#if hasSelection && !containsLockedAssets}
  <li class="px-4 py-3">
    <div class="flex gap-2">
      <input
        class="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary focus:outline-none disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
        placeholder={$t('add_to_menu_create_placeholder')}
        bind:value={newAlbumName}
        disabled={creatingAlbum}
        type="text"
      />
      <button
        class="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
        onclick={handleCreateAlbum}
        disabled={creatingAlbum || !newAlbumName.trim()}
        type="button"
      >
        <Icon aria-hidden icon={mdiPlus} size="16" />
        {$t('create')}
      </button>
    </div>
  </li>
{/if}
