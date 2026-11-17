import { asMutation, queryClient } from '#lib/queries/client.ts';
import {
  acceptClusterGroupRequest,
  clusterGroupRegeneratePeople,
  createClusterGroupRequest,
  deleteClusterGroupRequest,
  getClusterGroupRequests,
  getClusterGroupRequestsForGroup,
  getClusterGroupUsers,
  leaveClusterGroup,
} from '@immich/sdk';
import { queryOptions } from '@tanstack/svelte-query';

export const clusterGroupsQueryKey = ['cluster-groups'];

export const getClusterGroupRequestsQuery = () =>
  queryOptions({
    queryKey: [...clusterGroupsQueryKey, 'requests'],
    queryFn: ({ signal }) => getClusterGroupRequests({ signal }),
    staleTime: 0,
  });

export const getClusterGroupRequestsForGroupQuery = (id: string) =>
  queryOptions({
    queryKey: [...clusterGroupsQueryKey, id, 'requests'],
    queryFn: ({ signal }) => getClusterGroupRequestsForGroup({ id }, { signal }),
    staleTime: 0,
  });

export const getClusterGroupUsersQuery = (id: string) =>
  queryOptions({
    queryKey: [...clusterGroupsQueryKey, id, 'users'],
    queryFn: ({ signal }) => getClusterGroupUsers({ id }, { signal }),
    staleTime: 0,
  });

const invalidateClusterGroups = () => queryClient.invalidateQueries({ queryKey: clusterGroupsQueryKey });
const resetClusterGroups = () => queryClient.resetQueries({ queryKey: clusterGroupsQueryKey });

export const createClusterGroupRequestMutation = () =>
  asMutation(createClusterGroupRequest, { onSuccess: invalidateClusterGroups });

export const acceptClusterGroupRequestMutation = () =>
  asMutation(acceptClusterGroupRequest, { onSuccess: resetClusterGroups });

export const deleteClusterGroupRequestMutation = () =>
  asMutation(deleteClusterGroupRequest, { onSuccess: invalidateClusterGroups });

export const leaveClusterGroupMutation = () =>
  asMutation(leaveClusterGroup, {
    onSuccess: resetClusterGroups,
    meta: { error: { toast: 'errors.unable_to_leave_cluster_group' } },
  });

export const clusterGroupRegeneratePeopleMutation = () => asMutation(clusterGroupRegeneratePeople);
