import { preferences } from '$lib/stores/user.store';
import { updateMyPreferences } from '@immich/sdk';
import { DateTime } from 'luxon';
import { get } from 'svelte/store';

export const getButtonVisibility = (): boolean => {
  const myPreferences = get(preferences);

  if (!myPreferences) {
    return true;
  }

  const { purchase } = myPreferences;

  const now = DateTime.now();
  const hideUntilDate = DateTime.fromISO(purchase.hideBuyButtonUntil);
  const dayLeft = Number(now.diff(hideUntilDate, 'days').days.toFixed(0));

  return dayLeft > 0;
};

export const setSupportBadgeVisibility = async (value: boolean) => {
  const response = await updateMyPreferences({
    userPreferencesUpdateDto: {
      purchase: {
        showSupportBadge: value,
      },
    },
  });

  preferences.set(response);
};
