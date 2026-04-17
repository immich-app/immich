import { authManager } from '$lib/managers/auth-manager.svelte';
import { updateMyPreferences } from '@immich/sdk';
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

export const setSupportBadgeVisibility = async (value: boolean) => {
  const response = await updateMyPreferences({ userPreferencesUpdateDto: { purchase: { showSupportBadge: value } } });
  authManager.setPreferences(response);
};
