import { authManager } from '#lib/managers/auth-manager.svelte.ts';
import { executeMutation } from '#lib/queries/client.ts';
import { updateMyPreferencesMutation } from '#lib/queries/user.query.ts';
import { DateTime } from 'luxon';

export const getButtonVisibility = (): boolean => {
  if (!authManager.authenticated) {
    return true;
  }

  const now = DateTime.now();
  const hideUntilDate = DateTime.fromISO(authManager.preferences.purchase.hideBuyButtonUntil);
  const dayLeft = Number(now.diff(hideUntilDate, 'days').days.toFixed(0));

  return dayLeft > 0;
};

export const setSupportBadgeVisibility = (showSupportBadge: boolean) =>
  executeMutation(
    () => updateMyPreferencesMutation({}),
    [{ userPreferencesUpdateDto: { purchase: { showSupportBadge } } }],
  );
