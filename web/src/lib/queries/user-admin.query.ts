import { getHeatmapRange } from '#lib';
import { asMutation, queryClient } from '#lib/queries/client.ts';
import { QueryKeys } from '#lib/queries/query-keys.ts';
import {
  CalendarHeatmapType,
  createUserAdmin,
  deleteUserAdmin,
  getUserCalendarHeatmapAdmin,
  getUserPreferencesAdmin,
  getUserSessionsAdmin,
  getUserStatisticsAdmin,
  restoreUserAdmin,
  searchUsersAdmin,
  updateUserAdmin,
  type UserAdminResponseDto,
} from '@immich/sdk';
import { queryOptions } from '@tanstack/svelte-query';

const findOrFail = (users: UserAdminResponseDto[], id: string) => {
  const user = users.find((user) => user.id === id);
  if (!user) {
    throw new Error(`User ${id} not found`);
  }
  return user;
};

export const searchUsersAdminQuery = ({ withDeleted = false }: { withDeleted?: boolean } = {}) =>
  queryOptions({
    queryKey: QueryKeys.adminUsers({ withDeleted: true }),
    queryFn: ({ signal }) => searchUsersAdmin({ withDeleted: true }, { signal }),
    select: (users) => (withDeleted ? users : users.filter((user) => !user.deletedAt)),
  });

export const getUserAdminQuery = (id: string) =>
  queryOptions({
    ...searchUsersAdminQuery({ withDeleted: true }),
    select: (users) => findOrFail(users, id),
  });

export const getUserPreferencesAdminQuery = (id: string) =>
  queryOptions({
    queryKey: QueryKeys.adminUserPreferences({ id }),
    queryFn: ({ signal }) => getUserPreferencesAdmin({ id }, { signal }),
    staleTime: 0,
  });

export const getUserStatisticsAdminQuery = (id: string) =>
  queryOptions({
    queryKey: QueryKeys.adminUserStatistics({ id }),
    queryFn: ({ signal }) => getUserStatisticsAdmin({ id }, { signal }),
    staleTime: 0,
  });

export const getUserSessionsAdminQuery = (id: string) =>
  queryOptions({
    queryKey: QueryKeys.adminUserSessions({ id }),
    queryFn: ({ signal }) => getUserSessionsAdmin({ id }, { signal }),
    staleTime: 0,
  });

export const getUserCalendarHeatmapAdminQuery = (id: string) =>
  queryOptions({
    queryKey: QueryKeys.adminUserCalendarHeatmap({ id, type: CalendarHeatmapType.Upload }),
    queryFn: ({ signal }) =>
      getUserCalendarHeatmapAdmin({ ...getHeatmapRange(), id, $type: CalendarHeatmapType.Upload }, { signal }),
    staleTime: 0,
  });

export const createUserAdminMutation = () =>
  asMutation(createUserAdmin, {
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: QueryKeys.adminUsers({ withDeleted: true }), exact: true }),
    meta: { error: { toast: 'errors.unable_to_create_user' } },
  });

export const updateUserAdminMutation = () =>
  asMutation(updateUserAdmin, { onSuccess: onUpdateSuccess, meta: { success: { toast: true } } });

export const deleteUserAdminMutation = () =>
  asMutation(deleteUserAdmin, {
    onSuccess: onUpdateSuccess,
    meta: { success: { toast: true }, error: { toast: 'errors.unable_to_delete_user' } },
  });

export const restoreUserAdminMutation = () =>
  asMutation(restoreUserAdmin, {
    onSuccess: onUpdateSuccess,
    meta: { success: { toast: true }, error: { toast: 'errors.unable_to_restore_user' } },
  });

const onUpdateSuccess = (user: UserAdminResponseDto) =>
  queryClient.setQueryData(searchUsersAdminQuery().queryKey, (users) =>
    users?.map((item) => (item.id === user.id ? user : item)),
  );
