import { asMutation, queryClient } from '#lib/queries/client.ts';
import { QueryKeys } from '#lib/queries/query-keys.ts';
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

export const getClusterGroupRequestsQuery = () =>
  queryOptions({
    queryKey: QueryKeys.clusterGroupRequests(),
    queryFn: ({ signal }) => getClusterGroupRequests({ signal }),
  });

export const getClusterGroupRequestsForGroupQuery = (id: string) =>
  queryOptions({
    queryKey: QueryKeys.clusterGroupRequestsForGroup({ id }),
    queryFn: ({ signal }) => getClusterGroupRequestsForGroup({ id }, { signal }),
  });

export const getClusterGroupUsersQuery = (id: string) =>
  queryOptions({
    queryKey: QueryKeys.clusterGroupUsers({ id }),
    queryFn: ({ signal }) => getClusterGroupUsers({ id }, { signal }),
  });

const invalidateClusterGroups = () => queryClient.invalidateQueries({ queryKey: QueryKeys.clusterGroups() });
const resetClusterGroups = () => queryClient.resetQueries({ queryKey: QueryKeys.clusterGroups() });

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
