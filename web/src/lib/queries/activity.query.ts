import { authManager } from '#lib/managers/auth-manager.svelte.ts';
import { asMutation, queryClient } from '#lib/queries/client.ts';
import {
  ReactionType,
  createActivity,
  deleteActivity,
  getActivities,
  getActivityStatistics,
  type ActivityResponseDto,
} from '@immich/sdk';
import { queryOptions, type MutationMeta } from '@tanstack/svelte-query';

export type ActivityParams = { albumId: string; assetId?: string };

export const activitiesQueryKey = ['activities'];

const isMyLike = (activity: ActivityResponseDto, assetId?: string) =>
  activity.type === ReactionType.Like &&
  activity.user.id === authManager.user.id &&
  activity.assetId === (assetId ?? null);

export const invalidateActivities = ({ albumId }: { albumId: string }) =>
  queryClient.invalidateQueries({ queryKey: [...activitiesQueryKey, albumId] });

export const getActivitiesQuery = ({ albumId, assetId }: ActivityParams) =>
  queryOptions({
    queryKey: [...activitiesQueryKey, albumId, assetId ?? null],
    queryFn: ({ signal }) => getActivities({ albumId, assetId }, { signal }),
  });

export const getMyLikeQuery = ({ albumId, assetId }: ActivityParams) =>
  queryOptions({
    ...getActivitiesQuery({ albumId, assetId }),
    select: (activities) => activities.find((activity) => isMyLike(activity, assetId)) ?? null,
  });

export const getActivityStatisticsQuery = ({ albumId, assetId }: ActivityParams) =>
  queryOptions({
    queryKey: [...activitiesQueryKey, albumId, assetId ?? null, 'statistics'],
    queryFn: ({ signal }) => getActivityStatistics({ albumId, assetId }, { signal }),
  });

export const createActivityMutation = (meta?: MutationMeta) =>
  asMutation(createActivity, {
    onSuccess: async (activity, [{ activityCreateDto }]) => {
      const { albumId, assetId } = activityCreateDto;
      queryClient.setQueryData(
        getActivitiesQuery({ albumId, assetId }).queryKey,
        (activities) => activities && [...activities, activity],
      );
      await invalidateActivities({ albumId });
    },
    meta: meta ?? { error: { toast: 'errors.unable_to_add_comment' } },
  });

export const deleteActivityMutation = (meta?: MutationMeta) =>
  asMutation(deleteActivity, {
    onSuccess: async (_, [{ id }]) => {
      queryClient.setQueriesData<ActivityResponseDto[]>(
        { queryKey: activitiesQueryKey, predicate: ({ state }) => Array.isArray(state.data) },
        (activities) => activities?.filter((activity) => activity.id !== id),
      );
      await queryClient.invalidateQueries({ queryKey: activitiesQueryKey });
    },
    meta: meta ?? { error: { toast: 'errors.unable_to_remove_reaction' } },
  });
