import { asMutation, queryClient } from '#lib/queries/client.ts';
import { QueryKeys } from '#lib/queries/query-keys.ts';
import { deleteAllSessions, deleteSession, getSessions } from '@immich/sdk';
import { mutationOptions, queryOptions } from '@tanstack/svelte-query';

export const getSessionsQuery = () =>
  queryOptions({
    queryKey: QueryKeys.sessions(),
    queryFn: ({ signal }) => getSessions({ signal }),
  });

export const deleteSessionMutation = () =>
  asMutation(deleteSession, {
    onSettled: () => queryClient.invalidateQueries({ queryKey: QueryKeys.sessions() }),
    meta: { success: { toast: 'logged_out_device' }, error: { toast: 'errors.unable_to_log_out_device' } },
  });

export const deleteAllSessionsMutation = () =>
  mutationOptions({
    mutationFn: () => deleteAllSessions(),
    onSettled: () => queryClient.invalidateQueries({ queryKey: QueryKeys.sessions() }),
    meta: { success: { toast: 'logged_out_all_devices' }, error: { toast: 'errors.unable_to_log_out_all_devices' } },
  });
