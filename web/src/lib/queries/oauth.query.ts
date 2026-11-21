import { asMutation, queryClient } from '#lib/queries/client.ts';
import { getMyUserQuery } from '#lib/queries/user.query.ts';
import {
  finishOAuth,
  register,
  startOAuth,
  startOAuthReLink,
  unlinkOAuthAccount,
  type UserAdminResponseDto,
} from '@immich/sdk';

export const startOAuthMutation = () =>
  asMutation(startOAuth, {
    onSuccess: ({ url }) => location.assign(url),
    meta: { error: { toast: 'errors.unable_to_login_with_oauth' } },
  });

export const finishOAuthMutation = () => asMutation(finishOAuth, { meta: { error: { toast: false } } });

export const startOAuthReLinkMutation = () => asMutation(startOAuthReLink, { meta: { error: { toast: false } } });

export const registerOAuthMutation = () =>
  asMutation(register, { meta: { error: { toast: 'errors.unable_to_create_user' } } });

export const unlinkOAuthAccountMutation = () =>
  asMutation(unlinkOAuthAccount, {
    onSuccess: setMyUser,
    meta: { success: { toast: 'unlinked_oauth_account' }, error: { toast: 'errors.unable_to_unlink_account' } },
  });

const setMyUser = (user: UserAdminResponseDto) => queryClient.setQueryData(getMyUserQuery().queryKey, user);
