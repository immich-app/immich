import { invalidateAlbum, invalidateAlbums } from '#lib/queries/album.query.ts';
import { asMutation, queryClient } from '#lib/queries/client.ts';
import {
  createSharedLink,
  getAllSharedLinks,
  removeSharedLink,
  removeSharedLinkAssets,
  updateSharedLink,
  type SharedLinkResponseDto,
} from '@immich/sdk';
import { queryOptions } from '@tanstack/svelte-query';

const findOrFail = (sharedLinks: SharedLinkResponseDto[], id: string) => {
  const sharedLink = sharedLinks.find((sharedLink) => sharedLink.id === id);
  if (!sharedLink) {
    throw new Error(`Shared link ${id} not found`);
  }
  return sharedLink;
};

export const getAllSharedLinksQuery = ({ albumId }: { albumId?: string } = {}) =>
  queryOptions({
    queryKey: ['shared-links'],
    queryFn: ({ signal }) => getAllSharedLinks({}, { signal }),
    select: (sharedLinks) => (albumId ? sharedLinks.filter(({ album }) => album?.id === albumId) : sharedLinks),
  });

export const getSharedLinkQuery = (id: string) =>
  queryOptions({
    ...getAllSharedLinksQuery(),
    select: (sharedLinks) => findOrFail(sharedLinks, id),
  });

const onAlbumSharingChange = async (albumId?: string | null) => {
  await invalidateAlbums();
  if (albumId) {
    await invalidateAlbum(albumId);
  }
};

export const createSharedLinkMutation = () =>
  asMutation(createSharedLink, {
    onSuccess: async (_, [{ sharedLinkCreateDto }]) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getAllSharedLinksQuery().queryKey, exact: true }),
        onAlbumSharingChange(sharedLinkCreateDto.albumId),
      ]);
    },
    meta: { error: { toast: 'errors.failed_to_create_shared_link' } },
  });

export const updateSharedLinkMutation = () =>
  asMutation(updateSharedLink, {
    onSuccess: () => queryClient.invalidateQueries({ queryKey: getAllSharedLinksQuery().queryKey, exact: true }),
    meta: { success: { toast: 'saved' }, error: { toast: 'errors.failed_to_edit_shared_link' } },
  });

export const removeSharedLinkMutation = () =>
  asMutation(removeSharedLink, {
    onSuccess: async (_, [{ id }]) => {
      const albumId = queryClient
        .getQueryData(getAllSharedLinksQuery().queryKey)
        ?.find((sharedLink) => sharedLink.id === id)?.album?.id;
      queryClient.setQueryData(getAllSharedLinksQuery().queryKey, (sharedLinks) =>
        sharedLinks?.filter((sharedLink) => sharedLink.id !== id),
      );
      await onAlbumSharingChange(albumId);
    },
    meta: { success: { toast: 'deleted_shared_link' }, error: { toast: 'errors.unable_to_delete_shared_link' } },
  });

export const removeSharedLinkAssetsMutation = () =>
  asMutation(removeSharedLinkAssets, {
    onSuccess: () => queryClient.invalidateQueries({ queryKey: getAllSharedLinksQuery().queryKey, exact: true }),
    meta: { error: { toast: 'errors.unable_to_remove_assets_from_shared_link' } },
  });
