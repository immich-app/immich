import { asMutation, queryClient } from '#lib/queries/client.ts';
import { QueryKeys } from '#lib/queries/query-keys.ts';
import { deleteDatabaseBackup, listDatabaseBackups, startDatabaseRestoreFlow } from '@immich/sdk';
import { queryOptions, type MutationFilters } from '@tanstack/svelte-query';

export const getDatabaseBackupsQuery = () =>
  queryOptions({
    queryKey: QueryKeys.databaseBackups(),
    queryFn: ({ signal }) => listDatabaseBackups({ signal }),
    select: ({ backups }) => backups,
    staleTime: 0,
    meta: { error: { toast: 'errors.failed_to_load_database_backups' } },
  });

const deleteDatabaseBackupMutationKey = ['database-backups', 'delete'];

export const isDeletingDatabaseBackup = (filename: string): MutationFilters => ({
  mutationKey: deleteDatabaseBackupMutationKey,
  predicate: ({ state }) => {
    const [{ databaseBackupDeleteDto }] = state.variables as Parameters<typeof deleteDatabaseBackup>;
    return databaseBackupDeleteDto.backups.includes(filename);
  },
});

export const deleteDatabaseBackupMutation = () =>
  asMutation(deleteDatabaseBackup, {
    mutationKey: deleteDatabaseBackupMutationKey,
    onSuccess: (_, [{ databaseBackupDeleteDto }]) => {
      const deleted = new Set(databaseBackupDeleteDto.backups);
      queryClient.setQueryData(
        getDatabaseBackupsQuery().queryKey,
        (response) => response && { backups: response.backups.filter(({ filename }) => !deleted.has(filename)) },
      );
    },
    meta: { error: { toast: 'admin.maintenance_delete_error' } },
  });

export const startDatabaseRestoreFlowMutation = () =>
  asMutation(startDatabaseRestoreFlow, { meta: { error: { toast: 'admin.maintenance_start_error' } } });
