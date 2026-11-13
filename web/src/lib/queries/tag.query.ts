import { eventManager } from '#lib/managers/event-manager.svelte.ts';
import { asMutation, queryClient } from '#lib/queries/client.ts';
import {
  bulkTagAssets,
  bulkTagUntagAssets,
  deleteTag,
  getAllTags,
  queryTagsForAssets,
  untagAssets,
  updateTag,
  upsertTags,
  type TagResponseDto,
} from '@immich/sdk';
import { queryOptions } from '@tanstack/svelte-query';

const findOrFail = (tags: TagResponseDto[], id: string) => {
  const tag = tags.find((tag) => tag.id === id);
  if (!tag) {
    throw new Error(`Tag ${id} not found`);
  }
  return tag;
};

export const tagsQueryKey = ['tags'];

const invalidateTags = () => queryClient.invalidateQueries({ queryKey: tagsQueryKey });

export const getAllTagsQuery = () =>
  queryOptions({
    queryKey: tagsQueryKey,
    queryFn: ({ signal }) => getAllTags({ signal }),
    // TODO: invalidate from a server websocket event when tags change, then drop staleTime: 0
    staleTime: 0,
  });

export const getTagByIdQuery = (id: string) =>
  queryOptions({
    ...getAllTagsQuery(),
    select: (tags) => findOrFail(tags, id),
  });

export const upsertTagsMutation = () => asMutation(upsertTags, { onSuccess: invalidateTags });

export const updateTagMutation = () => asMutation(updateTag, { onSuccess: invalidateTags });

export const deleteTagMutation = () =>
  asMutation(deleteTag, { onSuccess: invalidateTags, meta: { success: { toast: true } } });

export const bulkTagAssetsMutation = () =>
  asMutation(bulkTagAssets, {
    onSuccess: (_, [{ tagBulkAssetsDto }]) => eventManager.emit('AssetsTag', tagBulkAssetsDto.assetIds),
    meta: { error: { toast: 'errors.failed_to_tag_assets' } },
  });

export const untagAssetsMutation = () => asMutation(untagAssets);

export const getTagsForAssetsQuery = (assetIds: string[]) =>
  queryOptions({
    queryKey: [...tagsQueryKey, 'assets', [...assetIds].sort()],
    queryFn: ({ signal }) => queryTagsForAssets({ tagsForAssetsDto: { assetIds } }, { signal }),
    staleTime: 0,
  });

export const bulkTagUntagAssetsMutation = () =>
  asMutation(bulkTagUntagAssets, {
    onSuccess: async (_, [{ tagBulkAddRemoveAssetsDto }]) => {
      eventManager.emit('AssetsTag', tagBulkAddRemoveAssetsDto.assetIds);
      await invalidateTags();
    },
    meta: { error: { toast: 'errors.failed_to_tag_assets' } },
  });
