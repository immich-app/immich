import { eventManager } from '#lib/managers/event-manager.svelte.ts';
import { asMutation, queryClient } from '#lib/queries/client.ts';
import { QueryKeys } from '#lib/queries/query-keys.ts';
import {
  changePassword,
  changePinCode,
  getAuthStatus,
  lockAuthSession,
  login,
  logout,
  resetPinCode,
  setupPinCode,
  signUpAdmin,
  unlockAuthSession,
  type AuthStatusResponseDto,
} from '@immich/sdk';
import { queryOptions } from '@tanstack/svelte-query';

export const getAuthStatusQuery = () =>
  queryOptions({
    queryKey: QueryKeys.authStatus(),
    queryFn: ({ signal }) => getAuthStatus({ signal }),
    staleTime: 0,
  });

export const loginMutation = () => asMutation(login, { meta: { error: { toast: false } } });

export const logoutMutation = () => asMutation(logout, { meta: { error: { toast: false } } });

export const signUpAdminMutation = () =>
  asMutation(signUpAdmin, {
    onSuccess: () => queryClient.refetchQueries({ queryKey: QueryKeys.serverConfig() }),
    meta: { error: { toast: 'errors.unable_to_create_admin_account' } },
  });

export const unlockAuthSessionMutation = () =>
  asMutation(unlockAuthSession, { meta: { error: { toast: 'wrong_pin_code' } } });

export const changePasswordMutation = () =>
  asMutation(changePassword, {
    meta: { success: { toast: 'updated_password' }, error: { toast: 'errors.unable_to_change_password' } },
  });

export const lockAuthSessionMutation = () =>
  asMutation(lockAuthSession, {
    onSuccess: () => eventManager.emit('SessionLocked'),
  });

export const setupPinCodeMutation = () =>
  asMutation(setupPinCode, {
    onSuccess: () => updateAuthStatusCache({ pinCode: true }),
    meta: { success: { toast: 'pin_code_setup_successfully' }, error: { toast: 'unable_to_setup_pin_code' } },
  });

export const changePinCodeMutation = () =>
  asMutation(changePinCode, {
    meta: { success: { toast: 'pin_code_changed_successfully' }, error: { toast: 'unable_to_change_pin_code' } },
  });

export const resetPinCodeMutation = () =>
  asMutation(resetPinCode, {
    onSuccess: () => updateAuthStatusCache({ pinCode: false }),
    meta: { success: { toast: 'pin_code_reset_successfully' }, error: { toast: 'errors.failed_to_reset_pin_code' } },
  });

const updateAuthStatusCache = (update: Partial<AuthStatusResponseDto>) =>
  queryClient.setQueryData(getAuthStatusQuery().queryKey, (status) => status && { ...status, ...update });
