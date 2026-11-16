import { asMutation } from '#lib/queries/client.ts';
import { unlinkAllOAuthAccountsAdmin } from '@immich/sdk';

export const unlinkAllOAuthAccountsAdminMutation = () =>
  asMutation(unlinkAllOAuthAccountsAdmin, { meta: { success: { toast: true } } });
