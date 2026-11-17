import { getHeatmapRange } from '#lib';
import { asMutation, queryClient } from '#lib/queries/client.ts';
import {
  createProfileImage,
  deleteProfileImage,
  deleteUserLicense,
  getMyCalendarHeatmap,
  getMyPreferences,
  getMyUser,
  getUser,
  searchUsers,
  setUserLicense,
  setUserOnboarding,
  updateMyPreferences,
  updateMyUser,
  type CalendarHeatmapType,
  type UserAdminResponseDto,
} from '@immich/sdk';
import { queryOptions, type MutationMeta } from '@tanstack/svelte-query';

const myUserQueryKey = ['users', 'me'];

export const getMyUserQuery = () =>
  queryOptions({
    queryKey: myUserQueryKey,
    queryFn: ({ signal }) => getMyUser({ signal }),
    gcTime: Infinity,
  });

export const getMyPreferencesQuery = () =>
  queryOptions({
    queryKey: [...myUserQueryKey, 'preferences'],
    queryFn: ({ signal }) => getMyPreferences({ signal }),
    gcTime: Infinity,
  });

export const getMyCalendarHeatmapQuery = ($type: CalendarHeatmapType) =>
  queryOptions({
    queryKey: [...myUserQueryKey, 'heatmap', $type],
    queryFn: ({ signal }) => getMyCalendarHeatmap({ ...getHeatmapRange(), $type }, { signal }),
    staleTime: 0,
  });

export const searchUsersQuery = () =>
  queryOptions({
    queryKey: ['users'],
    queryFn: ({ signal }) => searchUsers({ signal }),
    staleTime: 0,
  });

export const getUserQuery = (id: string) =>
  queryOptions({
    queryKey: ['users', id],
    queryFn: ({ signal }) => getUser({ id }, { signal }),
    staleTime: 0,
  });

export const updateMyUserMutation = () =>
  asMutation(updateMyUser, {
    onSuccess: (user) => queryClient.setQueryData(getMyUserQuery().queryKey, user),
    meta: { success: { toast: 'saved_profile' }, error: { toast: 'errors.unable_to_save_profile' } },
  });

export const updateMyPreferencesMutation = (meta?: MutationMeta) =>
  asMutation(updateMyPreferences, {
    onSuccess: (preferences) => queryClient.setQueryData(getMyPreferencesQuery().queryKey, preferences),
    meta: meta ?? { success: { toast: 'saved_settings' }, error: { toast: 'errors.unable_to_update_settings' } },
  });

export const createProfileImageMutation = () =>
  asMutation(createProfileImage, {
    onSuccess: ({ profileImagePath, profileChangedAt }) => updateMyUserCache({ profileImagePath, profileChangedAt }),
    meta: { success: { toast: 'profile_picture_set' }, error: { toast: 'errors.unable_to_set_profile_picture' } },
  });

export const deleteProfileImageMutation = () =>
  asMutation(deleteProfileImage, {
    onSuccess: () => updateMyUserCache({ profileImagePath: '' }),
    meta: { error: { toast: 'errors.unable_to_save_profile' } },
  });

export const setUserLicenseMutation = (meta?: MutationMeta) =>
  asMutation(setUserLicense, {
    onSuccess: (license) => updateMyUserCache({ license }),
    meta: meta ?? { error: { toast: 'purchase_failed_activation' } },
  });

export const deleteUserLicenseMutation = () =>
  asMutation(deleteUserLicense, {
    onSuccess: () => updateMyUserCache({ license: null }),
    meta: { error: { toast: 'errors.failed_to_remove_product_key' } },
  });

export const setUserOnboardingMutation = () => asMutation(setUserOnboarding);

const updateMyUserCache = (update: Partial<UserAdminResponseDto>) =>
  queryClient.setQueryData(getMyUserQuery().queryKey, (user) => user && { ...user, ...update });
