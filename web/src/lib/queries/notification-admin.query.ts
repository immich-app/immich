import { asMutation } from '#lib/queries/client.ts';
import { sendTestEmailAdmin } from '@immich/sdk';

export const sendTestEmailAdminMutation = () =>
  asMutation(sendTestEmailAdmin, { meta: { error: { toast: 'admin.notification_email_test_email_failed' } } });
