import { asMutation, queryClient } from '#lib/queries/client.ts';
import { getMyUserQuery } from '#lib/queries/user.query.ts';
import { finishOAuth, linkOAuthAccount, startOAuth, unlinkOAuthAccount, type UserAdminResponseDto } from '@immich/sdk';

export const startOAuthMutation = () =>
  asMutation(startOAuth, {
    onSuccess: ({ url }) => location.assign(url),
    meta: { error: { toast: 'errors.unable_to_login_with_oauth' } },
  });

export const finishOAuthMutation = () => asMutation(finishOAuth, { meta: { error: { toast: false } } });

export const linkOAuthAccountMutation = () =>
  asMutation(linkOAuthAccount, {
    onSuccess: setMyUser,
    meta: { success: { toast: 'linked_oauth_account' }, error: { toast: 'errors.unable_to_link_oauth_account' } },
  });

export const unlinkOAuthAccountMutation = () =>
  asMutation(unlinkOAuthAccount, {
    onSuccess: setMyUser,
    meta: { success: { toast: 'unlinked_oauth_account' }, error: { toast: 'errors.unable_to_unlink_account' } },
  });

const setMyUser = (user: UserAdminResponseDto) => queryClient.setQueryData(getMyUserQuery().queryKey, user);
