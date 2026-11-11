import { authManager } from '#lib/managers/auth-manager.svelte.ts';
import { eventManager } from '#lib/managers/event-manager.svelte.ts';
import { asMutation, queryClient } from '#lib/queries/client.ts';
import { Route } from '#lib/route.ts';
import { getFormatter } from '#lib/utils/i18n.ts';
import {
  addAssetsToAlbum,
  addAssetsToAlbums,
  addUsersToAlbum,
  AlbumUserRole,
  BulkIdErrorReason,
  createAlbum,
  deleteAlbum,
  getAlbumInfo,
  getAlbumMapMarkers,
  getAlbumStatistics,
  getAllAlbums,
  removeAssetFromAlbum,
  removeUserFromAlbum,
  updateAlbumInfo,
  updateAlbumUser,
  type AlbumResponseDto,
  type AlbumsAddAssetsResponseDto,
  type BulkIdResponseDto,
} from '@immich/sdk';
import { toastManager } from '@immich/ui';
import { mutationOptions, queryOptions, type MutationMeta } from '@tanstack/svelte-query';
import type { MessageFormatter } from 'svelte-i18n';
import { goto } from '$app/navigation';

type AlbumsFilter = { isOwned?: boolean; isShared?: boolean };

export const albumsQueryKey = ['albums'];

const isOwned = (album: AlbumResponseDto) =>
  authManager.authenticated &&
  album.albumUsers.some(({ role, user }) => role === AlbumUserRole.Owner && user.id === authManager.user.id);

const matchesFilter = (filter: AlbumsFilter) => (album: AlbumResponseDto) =>
  (filter.isOwned === undefined || isOwned(album) === filter.isOwned) &&
  (filter.isShared === undefined || album.shared === filter.isShared);

const findOrFail = (albums: AlbumResponseDto[], id: string) => {
  const album = albums.find((album) => album.id === id);
  if (!album) {
    throw new Error(`Album ${id} not found`);
  }
  return album;
};

export const getAllAlbumsQuery = (filter: AlbumsFilter = {}) =>
  queryOptions({
    queryKey: albumsQueryKey,
    queryFn: ({ signal }) => getAllAlbums({}, { signal }),
    select: (albums) => albums.filter(matchesFilter(filter)),
  });

export const getRecentAlbumsQuery = () =>
  queryOptions({
    ...getAllAlbumsQuery(),
    select: (albums) =>
      [...albums].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 3),
  });

export const getAlbumQuery = (id: string) =>
  queryOptions({
    ...getAllAlbumsQuery(),
    select: (albums) => findOrFail(albums, id),
  });

export const getAlbumsByAssetQuery = (assetId: string) =>
  queryOptions({
    queryKey: [...albumsQueryKey, 'asset', assetId],
    queryFn: ({ signal }) => getAllAlbums({ assetId }, { signal }),
  });

export const getAlbumStatisticsQuery = () =>
  queryOptions({
    queryKey: [...albumsQueryKey, 'statistics'],
    queryFn: ({ signal }) => getAlbumStatistics({ signal }),
  });

export const getAlbumInfoQuery = (id: string) =>
  queryOptions({
    queryKey: ['album', id],
    queryFn: ({ signal }) => getAlbumInfo({ ...authManager.params, id }, { signal }),
  });

export const getAlbumMapMarkersQuery = (id: string) =>
  queryOptions({
    queryKey: ['album', id, 'map-markers'],
    queryFn: ({ signal }) => getAlbumMapMarkers({ ...authManager.params, id }, { signal }),
  });

export const invalidateAlbums = () => queryClient.invalidateQueries({ queryKey: albumsQueryKey });

export const invalidateAlbum = (id: string) =>
  queryClient.invalidateQueries({ queryKey: getAlbumInfoQuery(id).queryKey, exact: true });

const onAlbumChange = async (album: AlbumResponseDto) => {
  queryClient.setQueryData(getAlbumInfoQuery(album.id).queryKey, album);
  await Promise.all([invalidateAlbum(album.id), invalidateAlbums()]);
};

const onAlbumAssetsChange = (ids: string[]) =>
  Promise.all([...ids.map((id) => invalidateAlbum(id)), invalidateAlbums()]);

export const createAlbumMutation = () =>
  asMutation(createAlbum, {
    onSuccess: onAlbumChange,
    meta: { error: { toast: 'errors.failed_to_create_album' } },
  });

const defaultMeta: MutationMeta = {
  success: { toast: 'album_info_updated' },
  error: { toast: 'errors.unable_to_update_album_info' },
};

export const updateAlbumInfoMutation = (meta?: MutationMeta) =>
  asMutation(updateAlbumInfo, { onSuccess: onAlbumChange, meta: meta ?? defaultMeta });

export const deleteAlbumMutation = (meta?: MutationMeta) =>
  asMutation(deleteAlbum, {
    onSuccess: (_, [{ id }]) => {
      queryClient.removeQueries({ queryKey: ['album', id] });
      return invalidateAlbums();
    },
    meta: meta ?? { error: { toast: 'errors.unable_to_delete_album' } },
  });

const notifyAddToAlbum = ($t: MessageFormatter, albumId: string, assetIds: string[], results: BulkIdResponseDto[]) => {
  const successCount = results.filter(({ success }) => success).length;
  const duplicateCount = results.filter(({ error }) => error === 'duplicate').length;
  let description: string | undefined;

  if (duplicateCount === assetIds.length) {
    description = $t('assets_were_part_of_album_count', { values: { count: duplicateCount } });
  } else if (successCount === assetIds.length) {
    description = $t('assets_added_to_album_count', { values: { count: successCount } });
  } else if (successCount > 0) {
    description = $t('assets_added_to_album_partial_count', { values: { successCount, totalCount: assetIds.length } });
  }

  const button = { label: $t('view_album'), onclick: () => goto(Route.viewAlbum({ id: albumId })) };
  if (description) {
    toastManager.primary({ description, button }, { timeout: 5000 });
    return;
  }

  toastManager.danger(
    { description: $t('assets_cannot_be_added_to_album_count', { values: { count: assetIds.length } }), button },
    { timeout: 5000 },
  );
};

const notifyAddToAlbums = (
  $t: MessageFormatter,
  albumIds: string[],
  assetIds: string[],
  results: AlbumsAddAssetsResponseDto,
) => {
  if (results.error === BulkIdErrorReason.Duplicate) {
    toastManager.info($t('assets_were_part_of_albums_count', { values: { count: assetIds.length } }));
  } else if (results.error) {
    toastManager.warning($t('assets_cannot_be_added_to_albums', { values: { count: assetIds.length } }));
  } else {
    toastManager.primary(
      $t('assets_added_to_albums_count', {
        values: { albumTotal: albumIds.length, assetTotal: assetIds.length },
      }),
    );
  }
};

export const addAssetsToAlbumsMutation = ({ notify = true }: { notify?: boolean } = {}) =>
  mutationOptions({
    mutationFn: ({
      albumIds,
      assetIds,
    }: {
      albumIds: string[];
      assetIds: string[];
    }): Promise<BulkIdResponseDto[] | AlbumsAddAssetsResponseDto> =>
      albumIds.length === 1
        ? addAssetsToAlbum({ ...authManager.params, id: albumIds[0], bulkIdsDto: { ids: assetIds } })
        : addAssetsToAlbums({ ...authManager.params, albumsAddAssetsDto: { albumIds, assetIds } }),
    onSuccess: async (results, { albumIds, assetIds }) => {
      eventManager.emit('AlbumAddAssets', { assetIds, albumIds });
      if (notify) {
        const $t = await getFormatter();
        if (Array.isArray(results)) {
          notifyAddToAlbum($t, albumIds[0], assetIds, results);
        } else {
          notifyAddToAlbums($t, albumIds, assetIds, results);
        }
      }
      await onAlbumAssetsChange(albumIds);
    },
    meta: { error: { toast: 'errors.error_adding_assets_to_album' } },
  });

export const removeAssetFromAlbumMutation = () =>
  asMutation(removeAssetFromAlbum, {
    onSuccess: (_, [{ id }]) => onAlbumAssetsChange([id]),
    meta: { error: { toast: 'errors.error_removing_assets_from_album' } },
  });

export const addUsersToAlbumMutation = () =>
  asMutation(addUsersToAlbum, {
    onSuccess: onAlbumChange,
    meta: { error: { toast: 'errors.error_adding_users_to_album' } },
  });

export const updateAlbumUserMutation = () =>
  asMutation(updateAlbumUser, {
    onSuccess: (_, [{ id }]) => onAlbumAssetsChange([id]),
    meta: { error: { toast: 'errors.unable_to_change_album_user_role' } },
  });

export const removeUserFromAlbumMutation = () =>
  asMutation(removeUserFromAlbum, {
    onSuccess: (_, [{ id }]) => onAlbumAssetsChange([id]),
    meta: { error: { toast: 'errors.unable_to_remove_album_users' } },
  });
