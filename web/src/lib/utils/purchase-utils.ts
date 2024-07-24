import { preferences } from '$lib/stores/user.store';
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

  if (dayLeft <= 0) {
    return false;
  } else {
    return true;
  }
};
